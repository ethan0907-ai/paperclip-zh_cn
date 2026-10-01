#!/bin/sh
# Compatibility entry point; Python enforces timeouts on macOS too.
exec python3 "$(dirname "$0")/batch-scheduler.py" "$@"
