# 制作スタジオの体制

「酒呑童子絵巻」を、ゲーム制作会社の部署制で進める。役割は `.claude/agents/` のサブエージェントとして定義している。判断の基準は `CLAUDE_CODE_RESTART_SPEC.md`（最優先）。

## 組織図

```
ユーザー（発注元・最終承認）
   │
 manager   統括マネージャー（全体の窓口・優先順位・品質・報告）
   │
 director  ディレクター（総括・振り分け・報告）
   ├─ planner       企画（仕様・バランスの案）
   ├─ programmer    プログラム（Godot 実装・動作確認）
   ├─ art-director  アート発注（ChatGPT への発注書・納品の検収）
   ├─ qa            品質保証（実行しての検収。修正はしない）
   └─ producer      進行・文書（PROGRESS / DECISIONS の更新・コミット）

外部: ChatGPT = 画像制作担当（キャラクター・背景・モーション）
```

## 進め方
0. manager がユーザーの依頼を受け、全体の優先順位と担当を決める。報告もここから行う。
1. director が `docs/PROGRESS.md` を読み、次の区切りを決めて各部署へ振る。
2. 仕様が曖昧なら planner が案を出し、**ユーザーが決める**。決定は producer が `docs/DECISIONS.md` に記録する。
3. 画像が要るときは art-director が `docs/asset-requests/` に発注書を作り、ユーザーが ChatGPT へ渡す。納品後は art-director が実ファイルを計測して検収する。
4. programmer が実装して実行確認し、qa が別視点で確認する。
5. producer が `docs/PROGRESS.md` を更新して区切りを報告する。一度に大量の工程を進めない。

## 全部署共通のルール（`CLAUDE.md` より）
- 画像は Claude Code が独断で作らない（例外は D12 の WALK の切り出しのみ）。API キー・画像生成 API は使わない。
- 不明は「要確認」。完了・未完了・既知の問題を区別し、未確認を「完成」と言わない。
- 既存ゲームの削除・全面上書き・依存関係の大幅変更は、影響を説明して承認を得る。
- 日本語。コミットは `<タイプ>: <説明>`。

## 使い方
「manager として次に何をやるか整理して」「director として R6 を進めて」「qa として歩行を確認して」のように部署名で依頼する。サブエージェントは `/agents` で一覧できる。
