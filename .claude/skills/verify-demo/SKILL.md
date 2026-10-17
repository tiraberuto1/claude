---
name: verify-demo
description: 指定したデモの index.html をヘッドレス Chromium で開き、コンソールエラーとスクリーンショットを確認する
disable-model-invocation: true
---

# デモ動作確認

引数: デモのディレクトリ名(`sekigahara` または `shuten-emaki`)。省略時は両方。

1. Playwright(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`、Chromium は `/opt/pw-browsers/chromium`)でファイルを `file://` で開く。
2. `console.error` と `pageerror` を収集し、3秒待機する。
3. スクリーンショットをスクラッチパッドに保存して内容を確認する。
4. エラー数・スクリーンショットのパス・気づいた描画上の問題を日本語で報告する。

`playwright install` は実行しないこと。CDN(Three.js・フォント)に届かない場合はその旨を報告する。
