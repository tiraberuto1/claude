"""人物A（左下の刀を持った武者）をゲーム用アセットに変換する。

切り抜きは extract_samurai.py が作った samurai_mask.png（元絵巻と同じ座標の二値マスク）を使う。
RGB は元絵巻の画素をそのまま使い、描き直しや補完はしない。

工程:
  1. 元絵巻 × マスク → 人物Aの外接矩形で切り出し（元サイズ）
  2. 外接矩形の高さ H_original を 256px に比例スケール（縦横同倍率）
  3. 384×384 キャンバスへ、足元（外接矩形の下端・左右中央）を接地点 GROUND に合わせて配置

出力:
  assets/characters/character_a/source/character_a_source.png  元サイズの切り抜き（RGBA）
  assets/characters/character_a/character_a.png                384×384 ゲーム用（RGBA・背景透明）
  assets/characters/character_a/character_a_reference.png      確認用デバッグ画像
  assets/characters/character_a/character_a.json               倍率・接地点などの数値
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SCROLL = ROOT / "assets/scroll/scroll_original.png"
MASK = ROOT / "assets/characters/samurai_left_bottom/samurai_mask.png"
OUT_DIR = ROOT / "assets/characters/character_a"

TARGET_H = 256              # 人物Aの基準身長（scale=1.0 のときの画面上の高さ）
CANVAS = 384                # 固定キャンバス（正方形）
GROUND = (192, 352)         # キャンバス内の接地点。全フレーム共通で固定する


def cut_source():
    scroll = np.array(Image.open(SCROLL).convert("RGBA"))
    mask = np.array(Image.open(MASK).convert("L")) > 0
    out = np.zeros_like(scroll)
    out[mask, :3] = scroll[mask, :3]
    out[mask, 3] = 255
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return Image.fromarray(out[y0:y1, x0:x1]), (int(x0), int(y0))


def to_game(src):
    w0, h0 = src.size
    scale = TARGET_H / h0
    w1 = round(w0 * scale)
    # 半透明の縁が黒ずまないよう、乗算済みアルファで縮小する
    small = src.convert("RGBa").resize((w1, TARGET_H), Image.LANCZOS).convert("RGBA")
    px = np.array(small)
    px[px[..., 3] == 0, :3] = 0   # 完全透明画素の色を消す
    small = Image.fromarray(px)

    left = GROUND[0] - w1 // 2
    top = GROUND[1] - TARGET_H
    assert left >= 0 and left + w1 <= CANVAS and top >= 0, "人物がキャンバスからはみ出す"
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(small, (left, top))
    return canvas, scale, (left, top, w1, TARGET_H)


def reference(game, box):
    left, top, w, h = box
    ref = Image.new("RGBA", (CANVAS, CANVAS))
    d = ImageDraw.Draw(ref)
    for y in range(0, CANVAS, 16):          # 透明部分が分かる市松模様
        for x in range(0, CANVAS, 16):
            c = 236 if (x // 16 + y // 16) % 2 == 0 else 212
            d.rectangle((x, y, x + 15, y + 15), fill=(c, c, c, 255))
    ref.alpha_composite(game)
    d = ImageDraw.Draw(ref)
    gx, gy = GROUND
    d.rectangle((0, 0, CANVAS - 1, CANVAS - 1), outline=(0, 0, 0, 255))
    d.line((gx, 0, gx, CANVAS), fill=(0, 120, 255, 255))                   # 中心線
    d.line((0, gy, CANVAS, gy), fill=(0, 160, 0, 255))                     # 接地線
    d.line((0, top, CANVAS, top), fill=(255, 140, 0, 255))                 # 身長 256px の上端
    d.rectangle((left, top, left + w - 1, top + h - 1), outline=(255, 140, 0, 160))
    d.line((8, top, 8, gy), fill=(255, 140, 0, 255), width=2)              # 身長の寸法線
    d.text((12, (top + gy) // 2 - 6), f"{TARGET_H}px", fill=(200, 90, 0, 255))
    d.ellipse((gx - 5, gy - 5, gx + 5, gy + 5), fill=(255, 0, 0, 255), outline=(255, 255, 255, 255))
    d.text((gx + 8, gy + 6), f"ground ({gx},{gy})", fill=(200, 0, 0, 255))
    d.text((4, 4), f"{CANVAS}x{CANVAS}", fill=(0, 0, 0, 255))
    return ref


def main():
    src, origin = cut_source()
    game, scale, box = to_game(src)
    (OUT_DIR / "source").mkdir(parents=True, exist_ok=True)
    src.save(OUT_DIR / "source/character_a_source.png")
    game.save(OUT_DIR / "character_a.png")
    reference(game, box).save(OUT_DIR / "character_a_reference.png")
    info = {
        "source": "assets/scroll/scroll_original.png",
        "source_bbox_in_scroll": [origin[0], origin[1], src.size[0], src.size[1]],
        "H_original": src.size[1],
        "scale": scale,
        "target_height": TARGET_H,
        "canvas_size": [CANVAS, CANVAS],
        "ground_point": list(GROUND),
        "sprite_bbox_in_canvas": list(box),
    }
    (OUT_DIR / "character_a.json").write_text(json.dumps(info, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(info, ensure_ascii=False))


if __name__ == "__main__":
    main()
