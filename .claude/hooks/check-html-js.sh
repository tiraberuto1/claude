#!/bin/bash
# 編集した HTML のインライン <script> を node --check で構文検証する
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in *.html) ;; *) exit 0 ;; esac
python3 -I - "$file" <<'PY'
import re, subprocess, sys, tempfile, os
html = open(sys.argv[1], encoding="utf-8").read()
bad = 0
for i, m in enumerate(re.finditer(r"<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>", html, re.S)):
    if "module" in m.group(1):
        suffix = ".mjs"
    else:
        suffix = ".js"
    with tempfile.NamedTemporaryFile("w", suffix=suffix, delete=False, encoding="utf-8") as f:
        f.write(m.group(2))
    r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
    os.unlink(f.name)
    if r.returncode:
        bad = 1
        print(f"script #{i} に構文エラー:\n{r.stderr}", file=sys.stderr)
sys.exit(2 if bad else 0)
PY
