# 酒伝童子絵巻｜絵が動く最小プロトタイプ

`SPEC.md` に仕様をまとめています。

対象人物は `target_reference.png` の赤枠で示した左下の武者です。

## 実行方法

1. Godot 4.3 以降でこのフォルダ（`project.godot`）を開く
2. F5 で実行（メインシーン: `scenes/prototype.tscn`）

- 武者が 12fps 基準でループ再生されます（フレームごとの長さは SPEC §7 の 120/100/100/80/60/180/120/200ms）
- **スペースキー**で一時停止すると 1 フレーム目に戻ります。1 フレーム目は元の絵巻と画素単位で同じなので、静止画と再生を見比べられます

### スマホ・ブラウザで見る

`python3 tools/export_web.py` で `build/web/index.html`（画像埋め込みの単一 HTML）を書き出せます。Godot シーンと同じ重ね順・フレーム長で再生し、絵のタップで停止（1 フレーム目に戻る）できます。

## シーン構成

```text
Prototype (Node2D)
├── Background / Sprite2D          scroll_background_clean.png（武者を除去した絵巻）
├── Samurai (0, 100) / AnimatedSprite2D   samurai_01〜08.png
├── Foreground / Sprite2D          scroll_foreground_oni.png
└── Camera2D（固定）
```

`Foreground` は、武者の兜に噛みつく酒呑童子の首の歯と下唇です。元絵では武者より手前に描かれているため、武者の上に重ねています。

## 素材の作り方（`tools/`）

素材はすべて元絵の画素から作っており、描き直しや AI による再生成はしていません。

| スクリプト | 出力 | 内容 |
|---|---|---|
| `extract_samurai.py` | `samurai_01.png`, `samurai_mask.png`, `scroll_foreground_oni.png` | 手作業の制約（`samurai_mask_config.json`）と GrabCut で武者を切り抜く |
| `restore_background.py` | `scroll_background_clean.png` | 武者の跡を金地・梁・畳縁・床・点線に分け、構造に沿って埋める |
| `make_frames.py` | `samurai_02〜08.png` | 刀は手を支点に回転、胴は頭と足元を固定した MLS 変形で動かす |
| `make_character_a.py` | `character_a/` 一式 | 人物A（同じ武者）をゲーム用 384×384 キャンバスへ変換（下記） |

```sh
pip install opencv-python-headless numpy
python3 tools/extract_samurai.py
python3 tools/restore_background.py
python3 tools/make_frames.py
python3 tools/make_character_a.py   # pillow が必要
python3 tools/export_web.py   # 任意：ブラウザ確認用
```

全フレームの原点は元絵巻の (0, 100)、サイズは 640×600 です（`frame_canvas.json`）。

## ゲーム用アセット：人物A（`assets/characters/character_a/`）

`CHARACTER_A_ASSET_SPEC` に従い、左下の武者を「サイズ・座標・接地点を統一したゲーム用人物」に変換したものです。切り抜きは `samurai_mask.png` と同じで、RGB は元絵巻の画素のままです。

| ファイル | 内容 |
|---|---|
| `source/character_a_source.png` | 元サイズの切り抜き（528×491、元絵巻上の外接矩形 (25, 170) 起点） |
| `character_a.png` | 384×384・RGBA・背景透明のゲーム用画像 |
| `character_a_reference.png` | 中心線・接地線・256px 基準身長・接地点を描いたデバッグ画像 |
| `character_a.json` | 倍率・接地点などの数値 |

- **H_original = 491px**：刀の切っ先から足先までの外接矩形の高さ。人物Aは跳躍中の姿勢で、刀を除いた高さ（約 320px）を基準にすると横幅が 384px に収まらないため、武器を含めた全高を基準にしています
- **scale = 256 / 491 ≈ 0.5214**：縦横同倍率で縮小（275×256）
- **接地点 = キャンバス (192, 352)**：外接矩形の下端（足先）を y=352、左右中央を x=192 に合わせています

Godot では `scenes/character_a.tscn` を使います。

```text
CharacterA (Node2D)          ← position が人物Aの足元
└── Sprite2D                 centered = false, offset = (-192, -352)
```

`CharacterA.scale = 1.0` で身長 256px。遠近は `scale` を 0.8 / 1.2 などに変えて表現できます（足元を中心に拡縮されます）。
