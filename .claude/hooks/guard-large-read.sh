#!/bin/bash
# 巨大ファイルを範囲指定なしで Read しようとしたらブロックする
input=$(cat)
file=$(echo "$input" | jq -r '.tool_input.file_path // empty')
limit=$(echo "$input" | jq -r '.tool_input.limit // empty')
[ -z "$file" ] || [ -n "$limit" ] || [ ! -f "$file" ] && exit 0
size=$(stat -c %s "$file")
if [ "$size" -gt 204800 ]; then
  echo "$file は ${size} バイトあります。Grep で場所を特定するか、offset/limit を指定して読んでください。" >&2
  exit 2
fi
