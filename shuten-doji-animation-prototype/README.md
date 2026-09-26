# 酒伝童子絵巻｜絵が動く最小プロトタイプ

`SPEC.md` に仕様をまとめています。

対象人物は `target_reference.png` の赤枠で示した左下の武者です。

## 実行方法

1. Godot 4.3 以降でこのフォルダ（`project.godot`）を開く
2. F5 で実行（メインシーン: `scenes/prototype.tscn`）

- 武者が 12fps 基準でループ再生されます（フレームごとの長さは SPEC §7 の 120/100/100/80/60/180/120/200ms）
- **スペースキー**で一時停止すると 1 フレーム目に戻ります。1 フレーム目は元の絵巻と画素単位で同じなので、静止画と再生を見比べられます

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

```sh
pip install opencv-python-headless numpy
python3 tools/extract_samurai.py
python3 tools/restore_background.py
python3 tools/make_frames.py
```

全フレームの原点は元絵巻の (0, 100)、サイズは 640×600 です（`frame_canvas.json`）。
