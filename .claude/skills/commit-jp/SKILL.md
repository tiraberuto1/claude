---
name: commit-jp
description: 変更内容から日本語のコミットメッセージを作り、コミットする
disable-model-invocation: true
---

# 日本語コミット

1. `git status` と `git diff` で変更を確認する。
2. 形式 `<タイプ>: <説明>` で日本語のメッセージを作る(タイプ: feat / fix / docs / refactor / chore)。
3. システムから指示された Co-Authored-By と Claude-Session の行を末尾に付ける。
4. 関連ファイルだけをステージしてコミットする。プッシュは頼まれたときのみ。
