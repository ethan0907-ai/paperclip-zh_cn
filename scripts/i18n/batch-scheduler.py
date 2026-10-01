#!/usr/bin/env python3
"""Run bounded translation batches in fresh Pi sessions (stdlib, macOS/Linux)."""
import argparse
import fcntl
import hashlib
import itertools
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parents[2]
HANDOFF = Path("doc/plans/2026-09-30-ui-translation-handoff.md")
PROMPT = Path(__file__).with_name("batch-prompt.txt")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def snapshot(root):
    names = subprocess.check_output(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard", "ui/src"],
        cwd=root).decode().split("\0")
    return {name: digest(root / name) for name in set(names) if name}


def is_test(name):
    return any(x in name for x in (".test.", ".spec.", ".stories.", "__tests__/", "__snapshots__/", "fixture"))


def result_status(path):
    last_message = None
    ended = False
    with path.open(errors="replace") as stream:
        for line in stream:
            try:
                event = json.loads(line)
            except ValueError:
                continue  # Startup warnings may share stdout/stderr.
            if not isinstance(event, dict):
                continue
            if event.get("type") == "message_end":
                message = event.get("message", {})
                if message.get("role") == "assistant":
                    last_message = message
            if event.get("type") == "agent_end":
                ended = True
    if last_message is None:
        raise RuntimeError(f"No assistant completion event; inspect {path}")
    reason = last_message.get("stopReason")
    if reason != "stop":
        usage = last_message.get("usage", {})
        raise RuntimeError(
            f"Pi response stopped with {reason!r}; input={usage.get('input', '?')}, "
            f"output={usage.get('output', '?')}. "
            f"{last_message.get('errorMessage', '')} Inspect {path}")
    if not ended:
        raise RuntimeError(f"Pi event stream ended without agent_end; inspect {path}")
    text = "\n".join(part.get("text", "") for part in last_message.get("content", [])
                     if part.get("type") == "text").strip()
    return text.splitlines()[-1].strip() if text else ""


def run_child(command, root, output, timeout, heartbeat=30, cancel=None):
    with output.open("wb") as log:
        process = subprocess.Popen(command, cwd=root, stdout=log, stderr=subprocess.STDOUT,
                                   stdin=subprocess.DEVNULL, start_new_session=True)
        try:
            started = time.monotonic()
            reported = started
            while True:
                if cancel is not None and cancel.is_set():
                    raise RuntimeError("Parallel batch cancelled")
                remaining = timeout - (time.monotonic() - started)
                if remaining <= 0:
                    raise subprocess.TimeoutExpired(command, timeout)
                try:
                    return process.wait(timeout=min(1 if cancel is not None else heartbeat, remaining))
                except subprocess.TimeoutExpired:
                    if time.monotonic() - reported < heartbeat:
                        continue
                    reported = time.monotonic()
                    elapsed = int(time.monotonic() - started)
                    print(f"  Pi running: {elapsed}s / {timeout}s; "
                          f"log {output.stat().st_size} bytes. "
                          "JSON events are being saved.", flush=True)
        finally:
            # Terminate the batch's entire process group, including tool subprocesses.
            try:
                os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                pass
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.wait()


def check_progress(before, after, old_handoff, new_handoff, status):
    changed = {p for p in before.keys() | after.keys() if before.get(p) != after.get(p)}
    if any(is_test(p) for p in changed):
        raise RuntimeError("Test files changed; inspect manually. Nothing was reverted.")
    if status == "ALL_DONE":
        if old_handoff == new_handoff:
            raise RuntimeError("ALL_DONE without an updated handoff.")
        return False
    if status != "BATCH_COMPLETE":
        raise RuntimeError(f"Batch status is {status!r}; inspect the handoff for the blocking reason.")
    if old_handoff == new_handoff or not changed:
        raise RuntimeError("No progress: need both UI content changes and an updated handoff.")
    return True


def check_repair(before, after, old_handoff, new_handoff, attempts, limit):
    changed = {p for p in before.keys() | after.keys() if before.get(p) != after.get(p)}
    if any(is_test(p) for p in changed):
        raise RuntimeError("Test files changed during blocked batch; inspect manually.")
    if old_handoff == new_handoff or attempts >= limit:
        raise RuntimeError("Blocked batch has no updated handoff or exhausted repair attempts.")


def verify_batch(root, output):
    def unique_object(pairs):
        obj = {}
        for key, value in pairs:
            if key in obj:
                raise RuntimeError(f"Duplicate locale key: {key}")
            obj[key] = value
        return obj
    def keys(value, prefix=""):
        if isinstance(value, dict):
            return {key for name, child in value.items()
                    for key in keys(child, prefix + name + ".")}
        return {prefix.rstrip(".")}
    locales = root / "ui/src/i18n/locales"
    en = json.loads((locales / "en.json").read_text(), object_pairs_hook=unique_object)
    zh = json.loads((locales / "zh-CN.json").read_text(), object_pairs_hook=unique_object)
    if keys(en) != keys(zh):
        raise RuntimeError("English/Chinese locale keys differ; inspect the saved edits.")
    checks = [
        ("keys", ["node", "scripts/i18n/scan-ui-copy.mjs", "--check-keys"], 120),
        ("locales", ["pnpm", "-C", "ui", "exec", "vitest", "run", "src/i18n/locale-validation.test.ts"], 120),
        ("formatters", ["node", "scripts/i18n/check-ui-formatters.mjs"], 120),
        ("tokens", ["pnpm", "check:token-gates"], 120),
        ("typecheck", ["pnpm", "-C", "ui", "typecheck"], 180),
    ]
    for label, command, timeout in checks:
        log = output.with_suffix(f".{label}.log")
        code = run_child(command, root, log, timeout)
        if code:
            raise RuntimeError(f"{label} check failed (exit {code}); inspect {log}")
    print("Scheduler verification: locale parity/validation, literal keys, token gates and UI typecheck passed.", flush=True)


def self_test():
    from parallel_batches import parallel_self_test
    parallel_self_test()
    before, after = {"ui/src/a.tsx": "old"}, {"ui/src/a.tsx": "new"}
    assert check_progress(before, after, "a", "b", "BATCH_COMPLETE")
    check_repair(before, after, "a", "b", 0, 2)
    for attempts, new_handoff in [(2, "b"), (0, "a")]:
        try:
            check_repair(before, after, "a", new_handoff, attempts, 2)
        except RuntimeError:
            pass
        else:
            raise AssertionError("Unbounded/undocumented repair accepted")
    for b, a, h, status in [(before, before, "b", "BATCH_COMPLETE"),
                            (before, after, "a", "BATCH_COMPLETE"),
                            (before, after, "b", "BATCH_BLOCKED"),
                            ({"a.test.ts": "a"}, {"a.test.ts": "b"}, "b", "BATCH_COMPLETE")]:
        try:
            check_progress(b, a, "a", h, status)
        except RuntimeError:
            continue
        raise AssertionError("Unsafe continuation accepted")
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        log = root / "out"
        assert run_child([sys.executable, "-c", 'print("BATCH_COMPLETE")'], root, log, 5) == 0
        for reason in ("stop", "length", "error"):
            message = {"role": "assistant", "stopReason": reason,
                       "content": [{"type": "text", "text": "BATCH_COMPLETE"}],
                       "usage": {"input": 62048, "output": 1}}
            log.write_text("Warning: new session\n" +
                           json.dumps({"type": "message_end", "message": message}) + "\n" +
                           json.dumps({"type": "agent_end"}) + "\n")
            if reason == "stop":
                assert result_status(log) == "BATCH_COMPLETE"
            else:
                try:
                    result_status(log)
                except RuntimeError:
                    pass
                else:
                    raise AssertionError("Truncated/error completion accepted")
        log.write_text(json.dumps({"type": "message_end", "message": {
            "role": "assistant", "stopReason": "stop", "content": []}}))
        try:
            result_status(log)
        except RuntimeError:
            pass
        else:
            raise AssertionError("Incomplete stream accepted")
        assert run_child([sys.executable, "-c", "import time; time.sleep(.12)"],
                         root, log, 5, heartbeat=.05) == 0
        assert run_child([sys.executable, "-c", "raise SystemExit(7)"], root, log, 5) == 7
        try:
            run_child([sys.executable, "-c", "import time; time.sleep(30)"], root, log, .1)
        except subprocess.TimeoutExpired:
            pass
        else:
            raise AssertionError("Timeout not enforced")
        with (root / "lock").open("a") as first, (root / "lock").open("a") as second:
            fcntl.flock(first, fcntl.LOCK_EX | fcntl.LOCK_NB)
            try:
                fcntl.flock(second, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                pass
            else:
                raise AssertionError("Duplicate scheduler accepted")
    print("Self-test passed: progress, test protection, status, failure, timeout, lock.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-batches", type=int, default=int(os.getenv("MAX_BATCHES", "8")))
    parser.add_argument("--until-done", action="store_true",
                        help="No batch limit; stop on completion, failure, timeout, or no progress")
    parser.add_argument("--max-repairs", type=int, default=2,
                        help="Fresh repair sessions after a blocked batch (default 2)")
    parser.add_argument("--timeout", type=int, default=int(os.getenv("TIMEOUT", "1200")),
                        help="Seconds per batch (default 1200)")
    parser.add_argument("--model", help="Explicit Pi model; otherwise configured default")
    parser.add_argument("--workers", type=int, default=1,
                        help="Parallel isolated translation workers (1–3, default 1)")
    parser.add_argument("--dry-run", action="store_true", help="Validate plan without Pi calls")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if args.max_batches < 1 or args.timeout < 1:
        parser.error("Batch count and timeout must be positive")
    if args.max_repairs < 0:
        parser.error("Repair count cannot be negative")
    if not 1 <= args.workers <= 3:
        parser.error("Worker count must be between 1 and 3")
    settings = json.loads((ROOT / ".pi/settings.json").read_text())
    if settings.get("compaction", {}).get("enabled") is not False:
        raise RuntimeError("Disable project compaction before running.")
    if not (ROOT / HANDOFF).is_file():
        raise RuntimeError("Handoff file is missing.")
    prompt = PROMPT.read_text()
    limit_label = "until done" if args.until_done else str(args.max_batches)
    if args.dry_run:
        print(f"Root: {ROOT}\nBatches: {limit_label}; timeout: {args.timeout}s\n"
              f"Handoff: {HANDOFF}; workers: {args.workers}\nFresh UUID per batch; no continue/resume/fork.\n"
              "No Pi process started. Stop any manually running Pi before the real run.")
        return
    git_dir = Path(subprocess.check_output(["git", "rev-parse", "--absolute-git-dir"], cwd=ROOT,
                                         text=True).strip())
    runs = git_dir / "pi-translation-runs"
    runs.mkdir(exist_ok=True)
    with (runs / "scheduler.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError("Another translation scheduler is running.")
        print("Ensure no manually started Pi is writing this workspace.", flush=True)
        audit_pending = False
        repair_attempts = 0
        batches = itertools.count(1) if args.until_done else range(1, args.max_batches + 1)
        for batch in batches:
            if args.workers > 1 and not audit_pending and not repair_attempts:
                from parallel_batches import parallel_round
                if parallel_round(ROOT, runs, args, prompt, batch):
                    continue
                # Empty dispatcher plan must be verified by the ordinary worker/audit.
            sid = str(uuid.uuid4())
            output = runs / f"{sid}.log"
            before, handoff = snapshot(ROOT), digest(ROOT / HANDOFF)
            command = ["pi", "-p", "--mode", "json", "--no-skills",
                       "--session-id", sid, "--name", f"ui-i18n-{batch}"]
            command += ["-e", str(PROMPT.with_name("context-guard.mjs"))]
            if args.model:
                command += ["--model", args.model]
            batch_prompt = prompt
            if repair_attempts:
                batch_prompt += (
                    "\n本批仅修复上一批交接记录的阻塞，不开始新的翻译范围。"
                    "以代码核对建议，不能盲从交接中的导入或命令。修复后运行对应检查，"
                    "更新交接并输出 BATCH_COMPLETE；无法修复输出 BATCH_BLOCKED。"
                    "模块外翻译调用应复用 ui/src/i18n/index.ts 导出的 t；"
                    "组件内使用 useTranslation，确保切换语言后重新渲染。只用 pnpm。"
                )
            if audit_pending:
                batch_prompt += (
                    "\n上一批报告 ALL_DONE。本批是独立完成复核，不直接相信交接结论。"
                    "检查 ui/src 产品 UI 的剩余硬编码用户文案、动态提示和对应语言 key，"
                    "排除代码标识、用户数据、测试和 fixture。发现遗漏则完成一小批，"
                    "列出其他遗漏，输出 BATCH_COMPLETE；仍有未解决产品错误输出 BATCH_BLOCKED。"
                    "仅在覆盖检查无待译项时更新交接中的检查范围、例外和证据，输出 ALL_DONE。"
                )
            command += ["--", batch_prompt]
            print(f"Batch {batch}/{limit_label}; session {sid}; log {output}", flush=True)
            code = run_child(command, ROOT, output, args.timeout)
            if code:
                raise RuntimeError(f"Pi exited {code}; see {output}")
            status = result_status(output)
            after, new_handoff = snapshot(ROOT), digest(ROOT / HANDOFF)
            if status == "BATCH_BLOCKED":
                check_repair(before, after, handoff, new_handoff, repair_attempts, args.max_repairs)
                repair_attempts += 1
                print(f"Batch blocked; fresh repair session {repair_attempts}/{args.max_repairs} next.",
                      flush=True)
                continue
            keep_going = check_progress(before, after, handoff, new_handoff, status)
            verify_batch(ROOT, runs / f"{sid}.checks.log")
            repair_attempts = 0
            print(f"Batch {batch}: {status}", flush=True)
            if not keep_going:
                if audit_pending:
                    print("Completion confirmed by a fresh audit session. Deferred tests remain out of scope.")
                    return
                audit_pending = True
                print("Pi reported ALL_DONE; next batch will independently check for omissions.", flush=True)
            else:
                audit_pending = False
        print("Batch limit reached. Review handoff before running again.")


if __name__ == "__main__":
    def interrupted(signum, frame):
        raise KeyboardInterrupt
    signal.signal(signal.SIGTERM, interrupted)
    try:
        main()
    except (RuntimeError, OSError, ValueError, subprocess.SubprocessError, KeyboardInterrupt) as error:
        print(f"STOPPED: {error or 'Interrupted'}. Saved edits are preserved.", file=sys.stderr)
        sys.exit(1)
