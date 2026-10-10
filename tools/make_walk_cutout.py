#!/usr/bin/env python3
"""MASTER の画素だけを切って動かし、歩行 6 コマを作る（新しく描かない）。

仕組み（切り紙の人形）:
  - 胴・袴・太刀・腕は 1 枚のまま、歩きに合わせてわずかに上下させる
  - 左右の脚（臑当〜草鞋）を袴の裾から切り分け、水平にせん断して前後に振る。
    せん断なので足の裏は水平のまま、同じ高さにそろう。遊脚（浮いている脚）は上に縮めて持ち上げる
  - 脚は袴の裾の下へ数十 px 延長し、つなぎ目に隙間が出ないようにする
  - 出力は MASTER と同じキャンバス。足元の位置がコマごとにずれない

使い方:
  python3 tools/make_walk_cutout.py godot/assets/characters/raiko/master/master.png 出力ディレクトリ
"""
import argparse
import math
import os

import numpy as np
from PIL import Image

FRAMES = 6
STRIDE = 70.0     # 足の前後の振れ幅の半分（MASTER の画素）
LIFT_MAX = 34.0   # 遊脚の持ち上げ（画素）
BOB_MAX = 14.0    # 胴の上下の最大量（画素）。背丈 1406px の約 1%
EXTEND = 30       # 脚を袴の下へ延ばす量（画素）
LEG_X = {"left": (95, 330), "right": (330, 520)}  # 画面の左側の脚 / 右側の脚の範囲


def leg_like(a):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    luma = (r * 299 + g * 587 + b * 114) // 1000
    return (a[..., 3] > 200) & ((luma < 90) | ((r > 140) & (g < 80) & (b < 80)))


def find_cut_lines(a):
    """各列で、袴の裾の下から脚（暗い色・赤い紐）が 25 行以上続く最初の行 = 脚の上端を求める。"""
    h, w = a.shape[:2]
    mask = leg_like(a)
    cuts = {}
    for name, (x0, x1) in LEG_X.items():
        ycs = np.full(w, np.nan)
        for x in range(x0, x1):
            col = mask[:, x]
            for y in range(1150, 1420):
                if col[y:y + 25].all():
                    ycs[x] = y
                    break
        y_h = float(np.nanmedian(ycs[x0:x1]))
        # 袴の裾から大きく外れた列は検出の失敗とみなし、検出できた列から補間する（縁の列を取りこぼさない）
        ok = ~np.isnan(ycs[x0:x1]) & (np.abs(ycs[x0:x1] - y_h) <= 14)
        xs_ok = np.nonzero(ok)[0]
        line = np.interp(np.arange(x1 - x0), xs_ok, ycs[x0:x1][xs_ok])  # 両端は端の値で延長される
        k = 15
        padded = np.pad(line, k // 2, mode="edge")
        line = np.array([np.median(padded[i:i + k]) for i in range(len(line))])
        ycs = np.full(w, 1400.0)
        ycs[x0:x1] = line
        cuts[name] = (ycs, y_h)
    return cuts


def split_layers(a, cuts):
    h, w = a.shape[:2]
    body = a.copy()
    shins = {}
    yy = np.arange(h)[:, None]
    for name, (x0, x1) in LEG_X.items():
        ycs, y_h = cuts[name]
        sel = np.zeros((h, w), bool)
        sel[:, x0:x1] = yy >= ycs[None, x0:x1]
        sel &= a[..., 3] > 0
        piece = np.zeros_like(a)
        piece[sel] = a[sel]
        body[sel] = 0
        # 袴の下へ延長: 各列の脚の上端の色を上へ繰り返す
        for x in range(x0, x1):
            yc = int(ycs[x])
            if yc < 1400 and sel[yc, x]:
                # 延長の色は、上端から数行下の色を使う（上端は袴の裾の線や縁の色むらを含みやすい）
                col = a[yc + 4, x].copy()
                col[3] = a[yc, x, 3]
                piece[yc - EXTEND:yc, x] = col
        ys, xs = np.nonzero(piece[..., 3] > 0)
        shins[name] = (piece, y_h, float(ys.max()))
    return body, shins


def pre(im):
    return im.convert("RGBa")


def warp_leg(piece, y_h, foot_bottom, forward, lift, bob):
    """脚を、袴の裾（y_h）より下だけ水平にせん断し、上下に伸縮する。forward>0 は画面の左（進行方向）。
    裾より上の延長部分（袴の下に隠れる分）は、横にずらさず、胴と同じ量だけ上下に動かす。"""
    H = foot_bottom - y_h
    y_top = y_h - bob                          # 胴が上がれば、裾も上がる
    s = (H + bob - lift) / H                   # 足の裏が（接地線 - 持ち上げ）に来るよう伸縮
    k = -forward / H                           # せん断（画面の左が x のマイナス）
    cut = int(math.floor(y_h))
    lower = piece.copy()
    lower[:cut] = 0
    upper = piece.copy()
    upper[cut:] = 0
    coeffs = (1.0, -k / s, k * y_top / s, 0.0, 1.0 / s, y_h - y_top / s)
    low = pre(Image.fromarray(lower, "RGBA")).transform(piece.shape[1::-1], Image.AFFINE, coeffs, Image.BICUBIC).convert("RGBA")
    up = Image.new("RGBA", low.size, (0, 0, 0, 0))
    up.paste(Image.fromarray(upper, "RGBA"), (0, -int(round(bob))))
    up.alpha_composite(low)                    # 下の部分（せん断した脚）を上に重ねる
    return up


def leg_state(phase):
    """歩きの位相（0〜1）から、足の前後位置（-1〜1・前が正）と持ち上げ（0〜1）を返す。"""
    phase %= 1.0
    if phase < 0.5:                            # 接地している間、足は後ろへ滑る
        return 1.0 - 4.0 * phase, 0.0
    u = (phase - 0.5) / 0.5                    # 浮いている間、足は後ろから前へ振り出される
    return -1.0 + 2.0 * u, math.sin(math.pi * u)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("master")
    ap.add_argument("outdir")
    ap.add_argument("--stride", type=float, default=STRIDE)
    ap.add_argument("--lift", type=float, default=LIFT_MAX)
    ap.add_argument("--bob", type=float, default=BOB_MAX)
    a = ap.parse_args()
    os.makedirs(a.outdir, exist_ok=True)

    img = np.array(Image.open(a.master).convert("RGBA"))
    cuts = find_cut_lines(img)
    body, shins = split_layers(img, cuts)
    h, w = img.shape[:2]
    for name in ("left", "right"):
        print(f"{name}: 袴の裾 y≈{shins[name][1]:.0f}  足の裏 y={shins[name][2]:.0f}  脚の長さ {shins[name][2] - shins[name][1]:.0f}px")

    for i in range(FRAMES):
        phase = i / FRAMES + 1.0 / (2 * FRAMES)     # コマの位相。コマ 1 は左脚が接地した直後
        bob = round(a.bob * (1.0 - math.cos(4.0 * math.pi * phase)) / 2.0)
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        for name, ph in (("left", phase), ("right", phase + 0.5)):   # 画面の右側の脚が手前（足の裏が下にある）なので後から重ねる
            fwd, lift = leg_state(ph)
            piece, y_h, foot_bottom = shins[name]
            canvas.alpha_composite(warp_leg(piece, y_h, foot_bottom, fwd * a.stride, lift * a.lift, bob))
        moved = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        moved.paste(Image.fromarray(body, "RGBA"), (0, -bob))
        canvas.alpha_composite(moved)
        canvas.save(os.path.join(a.outdir, f"{i + 1:02d}.png"))
        print(f"{i + 1:02d}.png  位相 {phase:.3f}  胴の上下 {bob}px")


if __name__ == "__main__":
    main()
