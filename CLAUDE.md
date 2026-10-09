# Claude.md - プロジェクトガイドライン

## 言語設定
- **デフォルト言語**: 日本語
- すべての回答、ドキュメント、コミットメッセージは日本語で記載します
- コード内のコメントは日本語またはコードの文脈に応じて英語を使用

## プロジェクト概要
このリポジトリは Claude Code 用の superpowers プラグインです。

## コミット規約
- コミットメッセージは日本語で記載
- 形式: `<タイプ>: <説明>`
- 例: `feat: ログイン機能を追加`

## ブランチ戦略
- 主な作業ブランチ: `claude/superpowers-plugin-07i1pb`

## ゲーム制作とアセット（godogen）
- ゲーム制作は `docs/godogen/runtime.md` と `docs/godogen/godot.md` に従う
- API キーは使わない。`/asset-gen` は呼ばず、絵が必要なときは `docs/asset-requests/` に発注書（プロンプト付き）を書き、仮素材で進める
