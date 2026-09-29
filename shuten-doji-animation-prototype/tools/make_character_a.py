#!/usr/bin/env python3
"""人物A (絵巻の左下の武者) をゲーム用の静止アセットにする。CHARACTER_A_ASSET_SPEC.md に対応。

  1. 元絵から人物を切り抜く (tools/make_assets.py が作るマスクを使う。元ピクセルのまま)
  2. 人物の高さ H_original を 256px にする比率で、縦横同倍率に縮小する
  3. 384x384 の固定キャンバスに置き、足元を接地点として固定する

出力 (assets/characters/character_a/):
  source/character_a_source.png  元サイズの切り出し (外接矩形で切る)
  character_a.png                384x384 のゲーム用 (RGBA、背景透明)
  character_a_reference.png      基準身長・接地点・中心線を重ねたデバッグ用

前提: python3 tools/make_assets.py を先に実行して tools/mask_samurai.png を作っておく。
再生成: python3 tools/make_character_a.py
"""
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCROLL = os.path.join(ROOT, "assets/scroll/scroll_original.png")
MASK = os.path.join(ROOT, "tools/mask_samurai.png")
OUT = os.path.join(ROOT, "assets/characters/character_a")

CANVAS = 384        # 固定キャンバスの一辺 (px)
BASE_H = 256        # 人物の基準身長 (px)
GROUND_Y = 352      # 接地点の y (キャンバス内)。下に 32px、上に 96px の余白ができる


def main():
    os.makedirs(os.path.join(OUT, "source"), exist_ok=True)
    rgb = np.array(Image.open(SCROLL).convert("RGB"))
    mask = np.array(Image.open(MASK)) > 0

    # --- 1. 切り抜き (元サイズ)。人物の高さは武器を含む外接矩形の高さ
    ys, xs = np.where(mask)
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    W, H = bx1 - bx0, by1 - by0
    rgba = np.dstack([rgb, mask.astype(np.uint8) * 255])[by0:by1, bx0:bx1]
    rgba[rgba[..., 3] == 0, :3] = 0
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "source/character_a_source.png"))

    # 接地点: 最も低い点 (草鞋の底) の中心
    low = ys >= ys.max() - 3
    foot_x = xs[low].mean() + 0.5 - bx0            # 切り出し内の x
    # --- 2. 縦横同倍率で縮小 (アルファ乗算済みで縮めて縁の色にじみを防ぐ)
    scale = BASE_H / H
    nw = int(round(W * scale))
    a = rgba[..., 3:4].astype(np.float32) / 255.0
    pm = np.concatenate([rgba[..., :3].astype(np.float32) * a, a], axis=-1)
    small = cv2.resize(pm, (nw, BASE_H), interpolation=cv2.INTER_AREA)
    sa = small[..., 3:4]
    srgb = np.where(sa > 1e-4, small[..., :3] / np.maximum(sa, 1e-4), 0)
    small8 = np.clip(np.concatenate([srgb, sa * 255.0], axis=-1) + 0.5, 0, 255).astype(np.uint8)

    # --- 3. 384x384 に配置。左右は中央、足元の下端を GROUND_Y に合わせる
    x0 = (CANVAS - nw) // 2
    y0 = GROUND_Y - BASE_H
    canvas = np.zeros((CANVAS, CANVAS, 4), np.uint8)
    canvas[y0:y0 + BASE_H, x0:x0 + nw] = small8
    canvas[canvas[..., 3] == 0, :3] = 0          # 完全透明の画素は RGB も 0 にそろえる
    Image.fromarray(canvas, "RGBA").save(os.path.join(OUT, "character_a.png"))
    gx = int(round(x0 + foot_x * nw / W))
    gy = GROUND_Y

    # --- デバッグ用画像
    ref = Image.new("RGBA", (CANVAS, CANVAS))
    d = ImageDraw.Draw(ref)
    for cy in range(0, CANVAS, 16):                      # 透明が分かる市松
        for cx in range(0, CANVAS, 16):
            v = 226 if (cx // 16 + cy // 16) % 2 == 0 else 204
            d.rectangle([cx, cy, cx + 15, cy + 15], fill=(v, v, v, 255))
    ref.alpha_composite(Image.fromarray(canvas, "RGBA"))
    d = ImageDraw.Draw(ref)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/fonts-japanese-gothic.ttf", 12)
    except OSError:
        font = ImageFont.load_default()
    d.line([(CANVAS // 2, 0), (CANVAS // 2, CANVAS)], fill=(0, 140, 200, 255), width=1)        # 中心線
    d.rectangle([x0, y0, x0 + nw - 1, y0 + BASE_H - 1], outline=(0, 160, 90, 255), width=1)    # 256px の枠
    d.line([(0, gy), (CANVAS, gy)], fill=(220, 40, 40, 255), width=1)                          # 接地線
    d.line([(gx - 8, gy), (gx + 8, gy)], fill=(220, 40, 40, 255), width=3)
    d.line([(gx, gy - 8), (gx, gy + 8)], fill=(220, 40, 40, 255), width=3)
    d.ellipse([gx - 5, gy - 5, gx + 5, gy + 5], outline=(220, 40, 40, 255), width=2)
    d.text((CANVAS // 2 + 4, 4), "中心線 x=%d" % (CANVAS // 2), fill=(0, 100, 150, 255), font=font)
    d.text((x0 + 4, y0 - 15), "基準身長 %dpx (武器を含む高さ)" % BASE_H, fill=(0, 110, 60, 255), font=font)
    d.text((min(gx + 8, CANVAS - 110), gy + 6), "接地点 (%d, %d)" % (gx, gy), fill=(200, 30, 30, 255), font=font)
    ref.save(os.path.join(OUT, "character_a_reference.png"))

    print("元サイズ %dx%d  scale=%.5f  縮小後 %dx%d" % (W, H, scale, nw, BASE_H))
    print("配置 x0=%d y0=%d  接地点=(%d, %d)  offset=Vector2(%d, %d)" % (x0, y0, gx, gy, -gx, -gy))


if __name__ == "__main__":
    main()
