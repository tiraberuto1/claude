# 酒伝童子絵巻｜絵が動く最小プロトタイプ

`SPEC.md` に仕様をまとめています。

対象人物は `target_reference.png` の赤枠で示した左下の武者です。
元絵巻から武者を切り抜き、部位ごとに少しだけ動かした 8 フレームを 12fps でループ再生します。

## 遊び方

Godot 4.3 以降でこのフォルダを開き、`scenes/prototype.tscn` を実行します
(初回はエディタが PNG をインポートします)。カメラも背景も固定で、動くのは武者だけです。

## アセットの再生成

```bash
pip install -r tools/requirements.txt
python3 tools/make_assets.py
```

`assets/scroll/scroll_original.png` から次を作ります。

| 出力 | 内容 |
|---|---|
| `assets/scroll/scroll_background_clean.png` | 人物を除去した背景 |
| `assets/characters/samurai_left_bottom/samurai_01〜08.png` | 武者の 8 フレーム (RGBA、580×580、元絵と同じ解像度) |
| `tools/mask_samurai.png` | 切り抜きマスク |
| `tools/preview/preview.gif` | 実際の表示時間で再生する確認用 GIF |

- 武者のピクセルは元絵のまま切り抜いています。再彩色・再生成・縮小はしていません。
- スプライトの左上は元絵の座標 (0, 120) です。Background と同じ原点に置けば元の位置に重なります。
- `samurai_01.png` は元の構えで、背景に重ねると元絵とほぼ一致します。

## 人物A (ゲーム用の静止アセット)

`CHARACTER_A_ASSET_SPEC.md` に沿って、同じ武者を「サイズ・座標・接地点をそろえたゲーム用の人物」にしています。

```bash
python3 tools/make_assets.py       # 先にマスクを作る
python3 tools/make_character_a.py
```

| 出力 (`assets/characters/character_a/`) | 内容 |
|---|---|
| `source/character_a_source.png` | 元サイズの切り出し (528×491) |
| `character_a.png` | 384×384 のゲーム用 (RGBA、背景透明) |
| `character_a_reference.png` | 基準身長・接地点・中心線を重ねた確認用 |

- **基準身長 256px:** 元の高さ 491px (刀を含む) を 256px にする比率 (0.5214) で、縦横同倍率に縮めています。
- **接地点:** 草鞋の底の中心で、キャンバス内の (91, 352) です。
- **`scenes/character_a.tscn`:** `CharacterA.position` が足元です。`scale = 1.0` で人物の高さが 256px になります。

Godot で `scale` を 0.8 / 1.0 / 1.2 にして描画し、高さが 205 / 256 / 308px、足元が動かないことを確認しています。

## 動かし方

画像全体を滑らせるのではなく、部位ごとに動きの量を変えています。

| 部位 | 動き |
|---|---|
| 頭 | 胴体の動きの 30% だけ (ほぼ固定) |
| 胴体 | 足元を中心に最大 1° 傾く |
| 刀・握る手 | 握りを中心に一体で -6° 〜 +15° 回す (最も大きく動く) |
| 右腕の前腕と手 | 肘を中心に -3° 〜 +4° |
| 裾・袖 | 最大 2px 揺れる |
| 足元 | 全フレームで固定 |

表示時間は 120 / 100 / 100 / 80 / 60 / 180 / 120 / 200 ms です。
値は `tools/make_assets.py` の `FRAMES` にあります。

## 既知の制限

- **背景の復元は簡易です。** 人物の背後にあった鬼の顔・髪・薙刀・梁は、周囲の色を回して埋めているだけで、絵として描き足してはいません。
  武者が常に覆っている部分は見えませんが、刀が動いたあとの元の位置など、露出する部分は自然に見えるように周囲へなじませています。
  `scroll_background_clean.png` 単体で見ると、人物のいた場所は滲んで見えます。
- 刀を大きく振ると、手の下に出ている柄の先端が少し浮きます。
- 手の周りには畳縁の一部が少し混ざっています。
