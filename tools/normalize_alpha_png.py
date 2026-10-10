#!/usr/bin/env python3
"""透過済みの画像を、ゲーム用に整える（絵柄は変えない）。

- アルファが --faint 以下のごく薄い画素を完全な透明にする（画面全体に散った残りかすの除去）
- 人物の範囲で切り出し、四辺に --margin の余白を付けたキャンバスに置き直す

使い方:
  python3 tools/normalize_alpha_png.py 入力 出力.png [--margin 0.06] [--faint 16]
"""
import argparse
import sys

import numpy as np
from PIL import Image


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--margin", type=float, default=0.06, help="四辺の余白の割合（出力キャンバスに対して）")
    ap.add_argument("--faint", type=int, default=16, help="この値以下のアルファを 0 にする")
    a = ap.parse_args()

    rgba = np.array(Image.open(a.src).convert("RGBA"))
    al = rgba[:, :, 3]
    faint = (al > 0) & (al <= a.faint)
    rgba[faint, 3] = 0
    rgba[rgba[:, :, 3] == 0, :3] = 0  # 完全透明の画素は色を持たせない

    ys, xs = np.nonzero(rgba[:, :, 3] > 0)
    if not len(ys):
        sys.exit("人物の領域が見つからない")
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    fig = rgba[y0:y1, x0:x1]
    bh, bw = fig.shape[:2]
    out_w = int(round(bw / (1 - 2 * a.margin)))
    out_h = int(round(bh / (1 - 2 * a.margin)))
    canvas = np.zeros((out_h, out_w, 4), np.uint8)
    ox, oy = (out_w - bw) // 2, (out_h - bh) // 2
    canvas[oy:oy + bh, ox:ox + bw] = fig
    Image.fromarray(canvas, "RGBA").save(a.dst, optimize=True)

    h, w = al.shape
    print(f"入力: {w}x{h}  消した薄い画素: {int(faint.sum())} px  人物の範囲: x {x0}-{x1 - 1}, y {y0}-{y1 - 1} ({bw}x{bh})")
    print(f"出力: {out_w}x{out_h}  余白 左 {ox} 右 {out_w - ox - bw} 上 {oy} 下 {out_h - oy - bh} px")


if __name__ == "__main__":
    main()
