# Pi translation batches

Stop any manually running Pi in this workspace first. The scheduler lock prevents
two copies of this scheduler, but cannot exclude unrelated editors or agents.

From the repository root:

```sh
python3 scripts/i18n/batch-scheduler.py --dry-run
python3 scripts/i18n/batch-scheduler.py --max-batches 8 --timeout 1200
```

To continue without a batch limit until completion:

```sh
python3 scripts/i18n/batch-scheduler.py --until-done --timeout 1200
```

For two concurrent translation workers:

```sh
python3 scripts/i18n/batch-scheduler.py --until-done --workers 2 --timeout 1200 --model openai-codex/gpt-6-luna
```

`--workers` accepts 1–3 (default 1). A short dispatcher session selects distinct
product files before each parallel round. Workers use separate source copies
containing the current saved changes; each worker may edit only its assigned
files, the two locale files, and its own handoff. Copies have independent Git
indexes without commits. Installed `node_modules` are linked read-only by
instruction; installing dependencies/building in workers is prohibited.
The scheduler merges locale changes by key, rejects differing edits to the same
key, and combines worker handoffs. It checks locale parity, token gates and UI
typecheck in a merged copy before writing results to the main workspace.
Related tests remain the worker's responsibility. No project commits or pushes
are made. The scheduler also stops if the main workspace changes during a round.

Each worker can use `--max-repairs` fresh repair sessions within its assigned
scope. On failure/conflict/Ctrl+C, isolated edits and logs remain under the printed
`parallel-<UUID>` directory in Git metadata; inspect those copies before retrying.
Unmerged worker edits are not automatically recovered on restart. Successful
rounds delete the temporary source copies while retaining logs. An empty
dispatcher plan falls back to the ordinary serial completion/audit process.
In parallel mode `--max-batches` counts rounds, not individual Pi calls; the
timeout applies to each dispatcher/worker/repair call. Do not run other writing
agents in this workspace, and restart an existing scheduler to enable this option.

This overrides the batch limit, but retains timeout, error, and no-progress stops.
If a worker reports BATCH_BLOCKED and has saved a new handoff, the scheduler
allows up to two fresh sessions focused only on repair. It never treats blocked
work as completed. Repeated blocks, missing handoff, or test edits still stop.
Use `--max-repairs 0` to disable this, or another nonnegative limit to adjust it.
After the first ALL_DONE, a fresh session checks for omissions. If it finds more
translation work, ordinary batches resume. Completion requires a second ALL_DONE
from that audit session. This is model-based review, not a proof of full coverage.
Already-running schedulers do not acquire new options; stop the old process before
starting this command.

Each batch starts `pi -p` with a fresh UUID, the repository as its working
directory, and the same short task prompt. It reads the local handoff, not the
previous session. The configured Pi model is used; pass `--model provider/model`
to override. Project auto-compaction must be disabled. Keep Pi's Hindsight
automatic injection disabled as previously configured; this script does not
change global settings or bypass project trust.

Every batch must update both the handoff and UI file contents and report
`BATCH_COMPLETE`. Failure, timeout, test-file changes, or missing progress stops
the loop without reverting edits. Content hashes detect further edits to files
already dirty before the run. They prove content changed, not translation quality;
the batch's checks and handoff remain the evidence of correctness.

`ALL_DONE` with an updated handoff triggers the fresh-session audit described
above (subject to the batch limit when not using --until-done). Deferred test work may remain.

Default limits: 8 batches, 20 minutes each. Logs use unique UUID filenames under
the Git metadata directory. Every 30 seconds the scheduler prints elapsed time
and log size. This reports process liveness, not verified translation progress.
Pi runs in JSON event mode, so tool and model events are saved during execution.
The scheduler requires a successful assistant stop and agent_end; length/error
responses are failures even when the Pi process exits zero. Logs live under
the Git metadata directory's `pi-translation-runs/`; the full path is printed
before each batch. Ctrl+C terminates the current batch's process group and stops
the scheduler. Inspect the log and handoff after an interruption before restarting.

Each Pi process explicitly loads `context-guard.mjs`. Tool text over 4000
characters is capped as described below. The extension activates only the four
built-in file/shell tools and registered context-mode execute/search tools.
The CLI uses `--no-skills` to omit the skill catalog in these mechanical batches;
repository context files still load. Memory tools are not activated for batch
workers; local handoff is the recovery source.

After each successful batch response the scheduler independently checks duplicate
locale keys, English/Chinese key parity, and runs token gates outside the model
context. Validation failure stops the loop. Related UI tests still depend on the
worker; skipped tests must remain clearly recorded in the handoff.

Tool text over 4000
characters is saved under the system temporary directory, and only an excerpt
reaches the model. With a reported model context window of at least 131072,
it queues wrap-up at 80000 context tokens or 40 turns and aborts at 100000 tokens
or 55 turns. Smaller or unknown windows retain wrap-up at 38000 tokens/20 turns
and abort at 48000 tokens/35 turns. The prompt targets 20–30 strings in one related
area for larger windows (8–12 for smaller windows). To select Luna explicitly:

```sh
python3 scripts/i18n/batch-scheduler.py --until-done --timeout 1200 --model openai-codex/gpt-6-luna
```

These are batch budgets, not a claim about the provider's maximum context.
A model may still ignore the wrap-up instruction; aborted batches
stop the scheduler and preserve files for inspection. Startup system messages and
large model-generated tool arguments are not reduced by this output guard.

Check the guard without making model requests:
`node scripts/i18n/context-guard-check.mjs`.
Restarting the scheduler always creates fresh sessions and preserves saved edits.

The shell entry point remains available:
`sh scripts/i18n/batch-scheduler.sh`. Both entry points accept `MAX_BATCHES` and
`TIMEOUT` environment defaults, overridden by command-line options.

Run the local checks without calling a model:

```sh
python3 scripts/i18n/batch-scheduler.py --self-test
```
