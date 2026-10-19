#!/bin/bash
# クラウドセッション開始時に portfolio-app の依存関係をインストールする
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

APP_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/portfolio-app"

# アプリ未作成の間は何もしない
if [ ! -f "$APP_DIR/package.json" ]; then
  echo "portfolio-app/package.json が無いためスキップ"
  exit 0
fi

cd "$APP_DIR"
# コンテナ状態がキャッシュされるため ci ではなく install を使う
npm install --no-audit --no-fund
