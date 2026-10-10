#!/usr/bin/env python3
"""焼き込まれた市松模様（透過の見た目）の背景を除去し、余白を付けた RGBA PNG を出力する。

絵柄の色は変えない。行うのは透過処理と余白の追加（位置合わせ）だけ。
背景の判定: 画像の外周から、明るい無彩色の画素（最小チャンネル >= --min-light、
彩度 <= --max-sat）をたどって塗りつぶした範囲を背景とみなす。
人物の内側にある白い部分は外周とつながらないので残る。
ただし腕と胴のすき間のように囲まれた背景もあるため、外周とつながらない
明るい無彩色の塊のうち --min-hole 画素以上のものも背景とみなす。

使い方:
  python3 tools/remove_checker_bg.py 入力 出力.png [--margin 0.06]
"""
import argparse
import sys
from collections import deque

import numpy as np
from PIL import Image


def background_mask(rgb, min_light, max_sat):
    """外周から明るい無彩色の画素をたどった範囲（True = 背景）を返す。"""
    h, w, _ = rgb.shape
    lo = rgb.min(axis=2)
    sat = rgb.max(axis=2) - lo
    cand = (lo >= min_light) & (sat <= max_sat)
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if cand[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if cand[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))
    return bg, lo, sat, cand


def enclosed_holes(cand, bg, min_hole):
    """外周とつながらない背景候補の塊のうち、min_hole 画素以上のものを返す。"""
    h, w = cand.shape
    rest = cand & ~bg
    seen = np.zeros((h, w), bool)
    holes = np.zeros((h, w), bool)
    sizes = []
    for sy, sx in zip(*np.nonzero(rest)):
        if seen[sy, sx]:
            continue
        pts = [(sy, sx)]
        seen[sy, sx] = True
        q = deque(pts)
        while q:
            y, x = q.popleft()
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and rest[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    pts.append((ny, nx))
                    q.append((ny, nx))
        if len(pts) >= min_hole:
            ys, xs = zip(*pts)
            holes[list(ys), list(xs)] = True
            sizes.append(len(pts))
    return holes, sizes


def edge_alpha(fg, lo, sat, min_light):
    """人物の外周 1px だけ、背景色に近いほど薄くする（なじませ）。"""
    alpha = np.where(fg, 255, 0).astype(np.float32)
    pad = np.pad(~fg, 1, constant_values=True)
    touches_bg = pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]
    ring = fg & touches_bg
    # 背景らしさ: 明るく無彩色なほど 1 に近い
    light = np.clip((lo.astype(np.float32) - (min_light - 60)) / 60.0, 0, 1)
    neutral = np.clip(1 - sat.astype(np.float32) / 40.0, 0, 1)
    bgness = light * neutral
    alpha[ring] = np.clip(255 * (1 - 0.85 * bgness[ring]), 40, 255)
    return alpha.astype(np.uint8), int(ring.sum())


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--margin", type=float, default=0.06, help="四辺の余白の割合（出力キャンバスに対して）")
    ap.add_argument("--min-light", type=int, default=205)
    ap.add_argument("--max-sat", type=int, default=12)
    ap.add_argument("--min-hole", type=int, default=200, help="囲まれた背景とみなす塊の最小画素数")
    a = ap.parse_args()

    rgb = np.array(Image.open(a.src).convert("RGB")).astype(np.int16)
    bg, lo, sat, cand = background_mask(rgb, a.min_light, a.max_sat)
    holes, hole_sizes = enclosed_holes(cand, bg, a.min_hole)
    bg |= holes
    fg = ~bg
    if not fg.any():
        sys.exit("人物の領域が見つからない")
    alpha, ring = edge_alpha(fg, lo, sat, a.min_light)

    ys, xs = np.nonzero(fg)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([rgb.astype(np.uint8), alpha])[y0:y1, x0:x1]
    rgba[rgba[:, :, 3] == 0, :3] = 0  # 完全透明の画素は色を持たせない

    bh, bw = rgba.shape[:2]
    out_w = int(round(bw / (1 - 2 * a.margin)))
    out_h = int(round(bh / (1 - 2 * a.margin)))
    canvas = np.zeros((out_h, out_w, 4), np.uint8)
    ox, oy = (out_w - bw) // 2, (out_h - bh) // 2
    canvas[oy:oy + bh, ox:ox + bw] = rgba
    Image.fromarray(canvas, "RGBA").save(a.dst, optimize=True)

    print(f"入力: {rgb.shape[1]}x{rgb.shape[0]}  人物の範囲: x {x0}-{x1 - 1}, y {y0}-{y1 - 1} ({bw}x{bh})")
    print(f"背景として除去: {int(bg.sum())} px（うち囲まれた背景 {len(hole_sizes)} か所 {sum(hole_sizes)} px）  人物: {int(fg.sum())} px  なじませた外周: {ring} px")
    print(f"出力: {out_w}x{out_h}  余白 左 {ox} 右 {out_w - ox - bw} 上 {oy} 下 {out_h - oy - bh} px")


if __name__ == "__main__":
    main()
