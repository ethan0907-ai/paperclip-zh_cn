"""Isolated Pi workers with checked file ownership and three-way locale merging."""
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from pathlib import Path
import shutil
import subprocess
import threading
import uuid

LOCALES = {"ui/src/i18n/locales/en.json", "ui/src/i18n/locales/zh-CN.json"}
HANDOFF = "doc/plans/2026-09-30-ui-translation-handoff.md"
MISSING = object()


def files(root):
    names = subprocess.check_output(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        cwd=root).decode().split("\0")
    return {name: (root / name).read_bytes() for name in set(names)
            if name and (root / name).is_file()}


def copy_workspace(root, target, baseline):
    target.mkdir(parents=True)
    for name, content in baseline.items():
        destination = target / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        source = root / name
        # Materialize source-file symlinks so editing a copy cannot modify the original.
        destination.write_bytes(content)
        shutil.copymode(source, destination)
    settings = target / ".pi/settings.json"
    settings.parent.mkdir(exist_ok=True)
    shutil.copy2(root / ".pi/settings.json", settings)
    parents = {root} | {root / name for name in baseline if name.endswith("package.json")}
    for parent in parents:
        parent = parent.parent if parent.name == "package.json" else parent
        source = parent / "node_modules"
        destination = target / parent.relative_to(root) / "node_modules"
        if source.is_dir() and not destination.exists():
            destination.symlink_to(source, target_is_directory=True)
    subprocess.run(["git", "init", "-q", str(target)], check=True)
    # Index the current dirty contents as the worker baseline, without committing.
    # Preserve tracked files that also match ignore rules; do not index linked dependencies.
    subprocess.run(["git", "add", "-f", "--pathspec-from-file=-", "--pathspec-file-nul"],
                   input=b"\0".join(name.encode() for name in baseline) + b"\0",
                   cwd=target, check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def load_json(content):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise RuntimeError(f"Duplicate JSON key: {key}")
            result[key] = value
        return result
    return json.loads(content, object_pairs_hook=unique)


def merge_json(base, current, incoming, prefix=""):
    if incoming == base or incoming == current:
        return current
    if current == base:
        return incoming
    if base is MISSING and isinstance(current, dict) and isinstance(incoming, dict):
        base = {}
    if all(isinstance(value, dict) for value in (base, current, incoming)):
        result = {}
        for key in list(base) + sorted((current.keys() | incoming.keys()) - base.keys()):
            value = merge_json(base.get(key, MISSING), current.get(key, MISSING),
                               incoming.get(key, MISSING), prefix + key + ".")
            if value is not MISSING:
                result[key] = value
        return result
    raise RuntimeError(f"Locale merge conflict at {prefix.rstrip('.')}")


def validate_scopes(scopes, baseline, workers):
    if not isinstance(scopes, list) or len(scopes) > workers:
        raise RuntimeError("Invalid dispatcher scope count")
    seen = set()
    for scope in scopes:
        if not isinstance(scope, dict) or not isinstance(scope.get("files"), list) or not scope["files"]:
            raise RuntimeError("Each scope needs a nonempty files list")
        if not isinstance(scope.get("task"), str) or not scope["task"].strip():
            raise RuntimeError("Each scope needs a task")
        for name in scope["files"]:
            if (not isinstance(name, str) or name not in baseline or
                    any(x in name for x in (".test.", ".spec.", "__tests__/", "__snapshots__/", "fixture")) or
                    not name.startswith(("ui/src/pages/", "ui/src/components/")) or
                    not name.endswith((".tsx", ".ts")) or name in seen):
                raise RuntimeError(f"Invalid or overlapping scope: {name}")
            seen.add(name)
    return scopes


def stage_merge(baseline, results):
    staged = dict(baseline)
    notes = []
    for scope, after in results:
        allowed = set(scope["files"]) | LOCALES | {HANDOFF}
        changed = {name for name in baseline.keys() | after.keys()
                   if baseline.get(name) != after.get(name)}
        if changed - allowed:
            raise RuntimeError(f"Worker changed files outside scope: {sorted(changed - allowed)}")
        if not changed.intersection(scope["files"]) or HANDOFF not in changed:
            raise RuntimeError("Worker needs product progress and an updated handoff")
        if any(name not in after for name in changed):
            raise RuntimeError("Worker deleted a file; inspect its workspace")
        for name in sorted(changed - {HANDOFF}):
            if name in LOCALES:
                merged = merge_json(load_json(baseline[name]), load_json(staged[name]),
                                    load_json(after[name]))
                staged[name] = (json.dumps(merged, ensure_ascii=False, indent=2) + "\n").encode()
            else:
                if staged[name] != baseline[name]:
                    raise RuntimeError(f"File merge conflict: {name}")
                staged[name] = after[name]
        notes.append("## " + ", ".join(scope["files"]) + "\n" + after[HANDOFF].decode())
    staged[HANDOFF] = ("# Parallel translation handoff\n\n" + "\n\n".join(notes)).encode()
    return staged


def parallel_self_test():
    import tempfile
    import __main__ as scheduler
    from types import SimpleNamespace
    from unittest.mock import patch
    a, b = "ui/src/pages/A.tsx", "ui/src/pages/B.tsx"
    scopes = [{"files": [a], "task": "a"}, {"files": [b], "task": "b"}]
    baseline = {a: b"old a", b: b"old b", HANDOFF: b"old handoff"}
    baseline.update({".gitignore": b".agents/\nserver/src/**/*.d.ts\nnode_modules/\n",
                     ".agents/skills/example/SKILL.md": b"tracked but ignored skill",
                     "server/src/types/express.d.ts": b"tracked but ignored type"})
    baseline.update({name: b'{"shared":"old"}' for name in LOCALES})
    validate_scopes(scopes, baseline, 2)
    for invalid in ([scopes[0], scopes[0]], [{"files": ["../A"], "task": "a"}],
                    [{"files": [a], "task": ""}]):
        try:
            validate_scopes(invalid, baseline, 2)
        except RuntimeError:
            pass
        else:
            raise AssertionError("Invalid scope accepted")
    results = []
    for scope, name, key in zip(scopes, [a, b], ["a", "b"]):
        after = dict(baseline)
        after[name] = b"translated"
        after[HANDOFF] = key.encode()
        after.update({locale: json.dumps({"shared": "old", "new": {key: key}}).encode()
                      for locale in LOCALES})
        results.append((scope, after))
    merged = stage_merge(baseline, results)
    assert merged[a] == merged[b] == b"translated"
    for locale in LOCALES:
        assert load_json(merged[locale])["new"] == {"a": "a", "b": "b"}
    bad = dict(results[0][1])
    bad[b] = b"unauthorized"
    for action in [lambda: stage_merge(baseline, [(scopes[0], bad)]),
                   lambda: merge_json({"k": "old"}, {"k": "a"}, {"k": "b"}),
                   lambda: load_json(b'{"k":1,"k":2}')]:
        try:
            action()
        except RuntimeError:
            pass
        else:
            raise AssertionError("Conflict/unauthorized edit accepted")
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory) / "source"
        root.mkdir()
        (root / ".pi").mkdir()
        (root / ".pi/settings.json").write_text('{"compaction":{"enabled":false}}')
        (root / "node_modules").mkdir()
        for name, content in baseline.items():
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
        workspace = Path(directory) / "copy"
        copy_workspace(root, workspace, baseline)
        assert files(workspace)[a] == baseline[a]
        assert files(workspace)[".agents/skills/example/SKILL.md"] == baseline[".agents/skills/example/SKILL.md"]
        assert files(workspace)["server/src/types/express.d.ts"] == baseline["server/src/types/express.d.ts"]
        assert (workspace / "node_modules").is_symlink()
        (workspace / a).write_bytes(b"worker edit")
        assert (root / a).read_bytes() == baseline[a]
        subprocess.run(["git", "init", "-q", str(root)], check=True)
        subprocess.run(["git", "add", "."], cwd=root, check=True)
        subprocess.run(["git", "add", "-f", ".agents/skills/example/SKILL.md",
                        "server/src/types/express.d.ts"], cwd=root, check=True)
        runs = Path(directory) / "runs"
        runs.mkdir()
        args = SimpleNamespace(workers=2, model=None, timeout=5, max_repairs=0)
        barrier = threading.Barrier(2)
        def fake_child(command, cwd, output, timeout, **kwargs):
            if command[0] != "pi":
                return 0
            if "dispatcher" in command:
                (cwd / ".pi-translation-plan.json").write_text(json.dumps({"scopes": scopes}))
            else:
                barrier.wait(timeout=5)  # Both worker calls must actually overlap.
                i = int(cwd.name.split("-")[-1]) - 1
                name = scopes[i]["files"][0]
                (cwd / name).write_bytes(b"translated")
                (cwd / HANDOFF).write_text(f"worker {i} complete")
                for locale in LOCALES:
                    value = load_json((cwd / locale).read_bytes())
                    value[f"worker{i}"] = "translated"
                    (cwd / locale).write_text(json.dumps(value))
            return 0
        with patch.object(scheduler, "run_child", side_effect=fake_child), \
                patch.object(scheduler, "result_status", side_effect=lambda log:
                             "PLAN_READY" if log.name == "dispatcher.log" else "BATCH_COMPLETE"), \
                patch.object(scheduler, "verify_batch") as verify:
            assert parallel_round(root, runs, args, "test prompt", 1)
            verify.assert_called_once()
        assert (root / a).read_bytes() == (root / b).read_bytes() == b"translated"
        for locale in LOCALES:
            value = load_json((root / locale).read_bytes())
            assert value["worker0"] == value["worker1"] == "translated"
        assert b"worker 0 complete" in (root / HANDOFF).read_bytes()
        assert b"worker 1 complete" in (root / HANDOFF).read_bytes()
    print("Parallel self-test passed: isolation, scopes, nested locale merge, conflicts, unauthorized edits.")


def parallel_round(root, runs, args, prompt, batch):
    # Import the live scheduler module; reuse its process handling and validation.
    import __main__ as scheduler
    wave = runs / ("parallel-" + str(uuid.uuid4()))
    wave.mkdir()
    baseline = files(root)
    planner = wave / "planner"
    copy_workspace(root, planner, baseline)
    def invoke(workspace, task, label, cancel=None):
        sid = str(uuid.uuid4())
        log = wave / (label + ".log")
        command = ["pi", "-p", "--mode", "json", "--no-skills", "--session-id", sid,
                   "--name", label, "-e", str(root / "scripts/i18n/context-guard.mjs")]
        if args.model:
            command += ["--model", args.model]
        print(f"Parallel batch {batch}: {label}; workspace {workspace}; log {log}", flush=True)
        if scheduler.run_child(command + ["--", task], workspace, log, args.timeout, cancel=cancel):
            raise RuntimeError(f"Worker failed; inspect {log}")
        return scheduler.result_status(log)
    plan_prompt = (
        f"你是只读翻译调度器。遵守 AGENTS.md，先读 {HANDOFF}。用 rg 和局部代码片段确认尚未翻译的"
        f"产品 UI，选择最多 {args.workers} 个互不重叠的文件范围，每个约20–30条文案。优先交接范围。"
        "不翻译、不运行测试、不修改产品文件、不读取整个大文件或语言包，不查记忆，不压缩。"
        '只写 .pi-translation-plan.json，格式 {"scopes":[{"files":["ui/src/pages/X.tsx"],'
        '"task":"具体范围和待译文案说明"}]}。文件只能来自 pages/components，禁止测试。'
        "确无产品候选则 scopes 为 []，不能把无法判断视为完成。最后一行输出 PLAN_READY。"
    )
    if invoke(planner, plan_prompt, "dispatcher") != "PLAN_READY":
        raise RuntimeError(f"Dispatcher failed to produce plan; inspect {wave}")
    planner_files = files(planner)
    changes = {p for p in baseline.keys() | planner_files.keys()
               if baseline.get(p) != planner_files.get(p)}
    if changes - {".pi-translation-plan.json"}:
        raise RuntimeError(f"Dispatcher edited files: {sorted(changes - {'.pi-translation-plan.json'})[:20]}; inspect {wave}")
    plan = load_json((planner / ".pi-translation-plan.json").read_bytes())
    if not isinstance(plan, dict) or "scopes" not in plan:
        raise RuntimeError(f"Invalid dispatcher plan; inspect {wave}")
    scopes = validate_scopes(plan["scopes"], baseline, args.workers)
    if not scopes:
        return False
    cancelled = threading.Event()
    tasks = []
    for i, scope in enumerate(scopes, 1):
        workspace = wave / f"worker-{i}"
        copy_workspace(root, workspace, baseline)
        task = prompt + (
            "\n本批为并行隔离工作，唯一允许修改的产品文件：" + ", ".join(scope["files"]) +
            "。具体任务：" + scope["task"] +
            "。只允许上述文件、en.json、zh-CN.json及交接文件，不修改其他文件；"
            "只检查分配范围，不判断全项目完成。完成输出 BATCH_COMPLETE；阻塞输出 BATCH_BLOCKED。"
            "交接只记录本范围，给出下一范围建议。外部调度器统一验证，不运行 token gates 或全仓库检查。"
            "node_modules 链接到主目录，只读；禁止安装依赖、构建或执行会修改依赖的命令。"
        )
        tasks.append((scope, workspace, task, f"worker-{i}"))
    results = []
    def translate(workspace, task, label):
        for attempt in range(args.max_repairs + 1):
            status = invoke(workspace, task, f"{label}-attempt-{attempt}", cancelled)
            if status == "BATCH_COMPLETE":
                return status
            if status != "BATCH_BLOCKED" or attempt == args.max_repairs:
                raise RuntimeError(f"Parallel worker blocked; preserved workspace: {workspace}")
            task += "\n本次仅修复此隔离副本交接中的阻塞，不扩展分配范围。修复后更新交接并 BATCH_COMPLETE。"
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(translate, workspace, task, label): (scope, workspace)
                   for scope, workspace, task, label in tasks}
        try:
            for future in as_completed(futures):
                scope, workspace = futures[future]
                if future.result() != "BATCH_COMPLETE":
                    raise RuntimeError(f"Parallel worker blocked; preserved workspace: {workspace}")
                results.append((scope, files(workspace)))
        finally:
            cancelled.set()
    staged = stage_merge(baseline, results)
    if files(root) != baseline:
        raise RuntimeError(f"Main workspace changed during parallel work; merge stopped. Inspect {wave}")
    # Validate the entire merge before applying any worker result to the main tree.
    merged_root = wave / "merged"
    copy_workspace(root, merged_root, staged)
    scheduler.verify_batch(merged_root, wave / "checks.log")
    if scheduler.run_child(["pnpm", "-C", "ui", "typecheck"], merged_root,
                           wave / "typecheck.log", 180):
        raise RuntimeError(f"Merged UI typecheck failed; inspect {wave}")
    if files(root) != baseline:
        raise RuntimeError(f"Main workspace changed during validation; inspect {wave}")
    staged[HANDOFF] += b"\nMerged verification: locale parity, token gates and UI typecheck passed.\n"
    for name, content in staged.items():
        if content != baseline[name]:
            (root / name).write_bytes(content)
    print(f"Parallel batch {batch}: merged {len(results)} workers; evidence {wave}", flush=True)
    # Successful copies are disposable; logs and failed workspaces are retained.
    for directory in [planner, merged_root] + [task[1] for task in tasks]:
        shutil.rmtree(directory)
    return True
