# 合格条件と検査方法

「実行」は実在して動くことを確かめたコマンド、「手動」は人が目で確かめる項目です。

## 共通（すべての作業）

- [ ] 依頼された範囲だけが変わっている（`git status --short` と `git diff --stat` で確かめる）
- [ ] 既存ファイルの意味を壊していない。原本を上書きしていない
- [ ] 分からないことを事実として書いていない
- [ ] 報告で、検査の成功・失敗・未実行を区別している

## AI 作業環境の設定（AGENTS.md、CLAUDE.md、`.claude/`、`docs/ai/`、`tasks/`）

- 実行: `python3 .claude/scripts/check_ai_setup.py`
  - 調べる項目: 必須ファイル、JSON の構文、`@import` 先の存在と循環、Hook の重複、Skills・Subagent・Rules の frontmatter（簡易的な読み取り）
  - 正式な YAML の検証はしていない（依存を増やさないため）
- 実行: `python3 .claude/scripts/test_check_ai_setup.py`（検査スクリプトと Hook 動作の単体テスト。一時フォルダだけを使う）
- 手動: 新しいセッションで `/memory`、`/context`、`/hooks`、`/permissions` を開き、読み込まれているか見る。`/` を入力してコマンド一覧に `project-work`、`project-check` が出るかも見る

## shuten-doji-animation-prototype

自動テストはありません。

- 実行（素材を作り直したとき）: `python3 tools/make_frames.py`（同フォルダで実行。`samurai_01〜08.png` を書き換える）
- 実行（任意）: `python3 tools/export_web.py <出力先>` で、ブラウザ用の単一 HTML を書き出す
- [ ] 手動: フレーム 01 と 08 が `samurai_01.png` と画素単位で一致する
- [ ] 手動: 足元が全フレームで揃い、上下にがたつかない（SPEC §8）
- [ ] 手動: 動きが「絵がほんの少し動いた」程度に収まっている（SPEC §5〜6）
- [ ] 手動: Godot 4.3 で `scenes/prototype.tscn` を実行して再生できる（このクラウド環境に Godot があるかは未確認）

## shuten-emaki / sekigahara

自動テストはありません。

- [ ] 手動: ブラウザで `index.html` を開き、表示が崩れず、コンソールにエラーが出ない
- [ ] 手動: スマートフォンの幅でも横にはみ出さない
- [ ] 単一ファイルの構成（画像の埋め込みを含む）を保っている
