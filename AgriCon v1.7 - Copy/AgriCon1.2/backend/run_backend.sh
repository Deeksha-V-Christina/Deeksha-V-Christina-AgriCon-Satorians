#!/usr/bin/env bash
# Start the AgriCon diagnosis API on 0.0.0.0:8000.
#
# Binding 0.0.0.0 (not 127.0.0.1) is what lets a phone reach this backend
# over Wi-Fi: the Android app (built with Capacitor) has no dev-server
# proxy, so it talks to this machine's LAN IP directly. In a browser tab
# nothing changes -- the Vite dev server still proxies /api here same as
# before.
set -euo pipefail
cd "$(dirname "$0")"
PY=python3
[ -x "../../project/.venv/bin/python" ] && PY=../../project/.venv/bin/python
[ -x ".venv/bin/python" ] && PY=.venv/bin/python
echo "Using interpreter: $PY"
echo
echo "On a phone (AgriCon Android app), set \"Backend address\" to one of this"
echo "machine's LAN IPv4 addresses below, with :8000 on the end."
(hostname -I 2>/dev/null || ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}') | tr ' ' '\n' | grep -v '^127\.' | grep -v '^$' | sed 's/^/  http:\/\//; s/$/:8000/'
echo
exec "$PY" -m uvicorn app:app --host 0.0.0.0 --port 8000
