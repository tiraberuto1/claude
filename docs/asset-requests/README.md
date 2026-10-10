# 画像制作の発注（Claude Code → ChatGPT）

**Claude Code は画像制作の発注者、ChatGPT は画像制作の担当者。**
Claude Code は画像を新規作成・修正して完成品として出さない（`CLAUDE_CODE_RESTART_SPEC.md` §3）。
API キー・画像生成 API は使わない。

## 流れ（§3.3）
1. Claude Code が必要な素材と仕様を特定する
2. Claude Code が発注プロンプトを `docs/asset-requests/NNN_*.md` に書き、チャットにも提示する
3. ユーザーがプロンプトを ChatGPT に渡す（参照画像はユーザーが添付する）
4. ChatGPT で画像を作成・修正する
5. ユーザーが画像をプロジェクトで使える形（指定パス）に置く
6. Claude Code が実ファイルを確認する
7. サイズ・透過・フレーム順・視認性を検証する
8. 問題がなければゲームに組み込み、動作確認する

画像の生成だけで実装完了と判断しない。

## ルール
- 発注プロンプトは独立した文章にする（ChatGPT に貼るだけで通じること）
- 不明な仕様は `【要確認】` とし、ユーザーが決めてから発注する
- 基本造形（MASTER CHARACTER）が承認されるまで、別のキャラクターや大量のモーションを発注しない
- 外部の参照・素材を使った場合は出典と利用条件を記録する

## ファイル
- `STYLE.md` … 共通スタイルガイド（指示書の要約）
- `TEMPLATE.md` … 発注書のひな形
- `001_raiko_master_character.md` … 発注 #001（源頼光 MASTER CHARACTER）
- `002_raiko_idle.md` … 発注 #002（源頼光 IDLE・待機 3 コマ）
- `003_raiko_master_emaki.md` … 発注 #003（源頼光 基準立ち絵の作り直し・絵巻寄せ・斜め左向き）
- `004_raiko_walk.md` … 発注 #004（源頼光 WALK・歩行 6 コマ・3×2 格子）
