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

## 資産管理アプリ(portfolio-app/)
株・投資信託の資産管理アプリ。個人利用・完全無料が前提。作業ブランチ: `claude/exciting-ritchie-r2053e`

### 構成方針
- フロント: Vite + React + TypeScript + Tailwind、グラフは Recharts
- データ保持・端末間同期: Firebase(Firestore + Google認証、Spark無料枠)。自分のアカウントのみ許可するルールで保護
- 価格取得: GitHub Actions の日次cronで `prices/*.json` を生成し、静的配信
- ホスティング: GitHub Pages、PWA(PC・スマホ両対応、モバイルファースト)
- 入力: SBI・楽天・松井・マネックスのCSV/コピペ取込。同一の会社・口座は置換方式で二重登録を防ぐ
- 価格ソースと証券会社プロファイルはアダプタ化し、差し替え可能にする

### 規約
- 実際の保有データ・CSVは公開リポジトリにコミットしない。サンプルは数量・金額を書き換えたものだけ `portfolio-app/samples/` に置く
- 非公式API(価格取得)は失敗を前提に、前回値の維持と手動上書きを用意する
- 完了前に `npm run lint` `npm run typecheck` `npm test` を通す(portfolio-app 内)
