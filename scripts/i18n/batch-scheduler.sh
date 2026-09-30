#!/bin/sh
# 串行调度器：Paperclip UI 中文翻译批次
# - 每批启动一个独立 `pi -p` 进程（新 session，无 -c/-r/--fork）
# - 批间串行；批次上限 MAX_BATCHES；失败即停
# - 进度以 交接文档 + git 变更 为准
set -eu
cd "$(dirname "$0")/../../.."
ROOT="$PWD"
PLAN="doc/plans/2026-09-30-ui-translation-handoff.md"
LOG="doc/plans/.translation-batch-scheduler.log"
MAX_BATCHES="${MAX_BATCHES:-8}"
TIMEOUT="${TIMEOUT:-3600}"
# macOS 没有 timeout；有 coreutils gtimeout 就用，否则退化为无超时（依赖进程自身退出）
TIMEOUT_CMD=""
if command -v gtimeout >/dev/null 2>&1; then TIMEOUT_CMD="gtimeout"; elif command -v timeout >/dev/null 2>&1; then TIMEOUT_CMD="timeout"; fi
PROMPT_FILE="$(pwd)/doc/plans/translation-batch-prompt.txt"
RUN_DIR="$(pwd)/doc/plans/.translation-runs"
mkdir -p "$RUN_DIR"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG"; }

if [ -f "$LOG" ]; then head -n 5 "$LOG"; fi
log "scheduler start (pid $$), max $MAX_BATCHES batches"
# 单写者锁：防止两个调度器并发
lockfile="$RUN_DIR/.lock"
if [ -e "$lockfile" ]; then
  log "FATAL: lock exists ($lockfile) - another scheduler may be running. Stopping."
  exit 1
fi
echo "pid=$$ started=$(date -u +%FT%TZ)" > "$lockfile"
trap 'rm -f "$lockfile"' EXIT

# 基线
BASE_MD5="$(md5 -q "$PLAN" 2>/dev/null || md5sum "$PLAN" | cut -d' ' -f1)"
BASE_CHG="$(git status --porcelain ui/src | wc -l | tr -d ' ')"
log "baseline: plan_md5=$BASE_MD5 ui_changed_files=$BASE_CHG"

for batch in $(seq 1 "$MAX_BATCHES"); do
  plan_md5="$(md5 -q "$PLAN" 2>/dev/null || md5sum "$PLAN" | cut -d' ' -f1)"
  chg="$(git status --porcelain ui/src | wc -l | tr -d ' ')"
  log "batch $batch starting (plan_md5=$plan_md5 ui_changed=$chg)"

  # 每批独立、确定性的 session id（全新，不 fork）
  sid="i18n-batch-$(date +%Y%m%d)-$(printf '%03d' "$batch")-$$"

  if [ -n "$TIMEOUT_CMD" ]; then
    run_batch() { "$TIMEOUT_CMD" "$TIMEOUT" "$@"; }
  else
    log "WARN: no timeout/gtimeout available; batches run without wall-clock cap."
    run_batch() { "$@"; }
  fi
  if ! run_batch pi -p --session-id "$sid" --name "ui-i18n-batch-$batch" \
      -- "$(cat "$PROMPT_FILE")" > "$RUN_DIR/batch-$batch.out" 2> "$RUN_DIR/batch-$batch.err"; then
    log "batch $batch FAILED (exit $?, session=$sid). Last stderr lines:"
    tail -n 5 "$RUN_DIR/batch-$batch.err" | tee -a "$LOG"
    log "STOPPING: batch failure."
    exit 1
  fi
  log "batch $batch finished (session=$sid)"

  new_md5="$(md5 -q "$PLAN" 2>/dev/null || md5sum "$PLAN" | cut -d' ' -f1)"
  new_chg="$(git status --porcelain ui/src | wc -l | tr -d ' ')"
  if [ "$new_md5" = "$plan_md5" ] && [ "$new_chg" = "$chg" ]; then
    log "STOPPING: no verifiable progress after batch $batch (handoff + git both unchanged)."
    exit 1
  fi
  log "batch $batch progress verified: plan_md5 $plan_md5->$new_md5, ui_changed $chg->$new_chg"
  BASE_MD5="$new_md5"; BASE_CHG="$new_chg"
done

log "reached MAX_BATCHES ($MAX_BATCHES). Stopping (success)."
