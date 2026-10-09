# godogen（Godot 4 / Claude Code）

[htdt/godogen](https://github.com/htdt/godogen) を `publish.sh --engine godot --agent claude` でレンダリングして取り込んだもの。

- `.claude/skills/asset-gen/` … アセット生成スキル（`/asset-gen`）
- `runtime.md` … godogen のランタイム指示書（公開先では `CLAUDE.md` になるもの。既存の `CLAUDE.md` を上書きしないためここに配置）
- `godot.md` … Godot エンジンガイド

ゲームを作るときは `runtime.md` と `godot.md` を読んで進める。

## API キー無し運用
このリポジトリは画像生成 API のキーを使わない。`/asset-gen` は呼ばず、絵が必要な場面では
`docs/asset-requests/` に発注書（プロンプト付き）を書き、人間が別途 AI で作成して差し替える。
詳細は `docs/asset-requests/README.md`。`.claude/skills/asset-gen/` は参考用に残している。
