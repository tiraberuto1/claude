# 背景と前提（AI 作業用）

必要なときに読む資料です。常に読み込まれるわけではありません。

## 目的

日本の絵巻・歴史題材を、画面上で「見て分かる」形にする試作を集めている。
中心にある `shuten-doji-animation-prototype` の狙いは、「大和絵風のキャラクターが動く」ことではなく、「一枚の大和絵そのものが動いた」と感じられることを確かめること（同フォルダの `SPEC.md` 冒頭）。

## 読者・利用者

- 作業を依頼する人: リポジトリの持ち主。スマートフォンで結果を見ることがある。
- 見る人（想定）: 未確認。一般の閲覧者か、関係者だけかは決まっていない。

## 参照すべき資料

| 資料 | 内容 |
|---|---|
| `shuten-doji-animation-prototype/SPEC.md` | 試作の仕様。元絵の画素を保つ、8 フレーム、12fps 基準のフレーム長、足元を揃える |
| `shuten-doji-animation-prototype/README.md` | 実行方法、素材を作るスクリプト（`tools/`）、ゲーム用アセット |
| `shuten-doji-animation-prototype/assets/characters/samurai_left_bottom/frame_canvas.json` | フレームの原点とサイズ |

## 確定事項

- 素材は元絵の画素から作り、描き直しや AI での再生成をしない（SPEC §2〜3、README）。
- フレーム 01 と 08 は元絵と画素単位で一致させる（`tools/make_frames.py` の説明）。
- 素材を作るには Python 3 と `opencv-python-headless`、`numpy` が要る。`make_character_a.py` には `pillow` も要る（README）。
- `shuten-doji-animation-prototype/.godot/` と `build/` は Git の管理外（同フォルダの `.gitignore`）。

## 未確認事項

- `scroll_original.png` など、SPEC が挙げる元画像の出典とライセンス。リポジトリには入っていない。
- `shuten-emaki/` と `sekigahara/` の仕様書・要件。HTML 本体しかない。
- `sekigahara/index.html` の年代・兵力などの数値の出典。
- 公開するかどうか、公開先。
- 元の CLAUDE.md にあった「このリポジトリは superpowers プラグイン」という記載。中身と合わないので AGENTS.md には採っていない。原文は `docs/ai/setup-report.md` に残してある。
