---
paths:
  - "shuten-doji-animation-prototype/**"
---

# shuten-doji-animation-prototype の作業ルール

- 仕様の正本は `shuten-doji-animation-prototype/SPEC.md`。README と食い違うときは SPEC を優先し、食い違いを報告する。
- 人物は元絵の画素を移動・変形させるだけで動かす。描き直し、塗り足しによる作画、生成 AI での作り直しはしない。
- `samurai_01.png` は変えない。フレーム 01 と 08 は 01 と画素単位で一致させる。
- 人物全体を平行移動するだけの動きにしない。頭と足元はほぼ固定する（SPEC §6、§8）。
- 動きの大きさは `tools/make_frames.py` の `FRAMES` 表で調整する。PNG を手で書き換えない。
- `tools/*.py` を実行すると `assets/` の PNG が上書きされる。実行する前に、どのファイルが変わるかを伝える。
- `.godot/` と `build/` は生成物なので編集しない。
