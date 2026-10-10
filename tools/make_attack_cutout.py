#!/usr/bin/env python3
"""MASTER の画素だけを切って動かし、攻撃（太刀を振る）の 4 コマを作る（新しく描かない）。

仕組み（切り紙の人形）:
  - 太刀（柄・鍔・鞘）と、それを握る手を 1 つの部品として切り出し、手首を軸に回す
  - 太刀が抜けた跡は、近くの絵の同じ行を横にずらして写して埋める（帯の縞に合う）
  - 胴は前後に傾け（せん断）て踏み込み、脚は歩行と同じ方法で前後に開く
  - 太刀は鞘に収めたまま。刀身は描かれない（`docs/DECISIONS.md` D14）

使い方:
  python3 tools/make_attack_cutout.py godot/assets/characters/raiko/master/master.png 出力ディレクトリ [--proto]
"""
import argparse
import math
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_walk_cutout as walk  # noqa: E402

# --- 太刀の形（MASTER の画素座標）。折れ線に沿った帯で切り出す ---
PIVOT = (385.0, 691.0)  # 手首（手が白い袖口と接するところ）。ここを軸に回す
# (始点, 終点, 半幅)。柄 → 鍔 → 手の下の黒い部分 → 鞘
CAPSULES = [
    ((246, 612), (333, 664), 17),
    ((333, 664), (385, 702), 18),
    ((385, 702), (400, 742), 17),
    ((400, 742), (520, 843.5), 17),
    ((520, 843.5), (634, 929), 17),
]
GUARD = ((336, 667), 27)      # 鍔（円）
HAND = ((379, 722), 52)       # 手（この円の中の肌色の画素）
SWORD_DIR_DEG = 37.4          # 鞘が水平から下へ向く角度（画面の座標で時計回りが正）
Y_REF = 1260.0                # 胴の傾きの基準（袴の裾）
Y_HEAD = 96.0


def seg_dist(xx, yy, p, q):
    px, py = p
    qx, qy = q
    dx, dy = qx - px, qy - py
    t = np.clip(((xx - px) * dx + (yy - py) * dy) / (dx * dx + dy * dy), 0, 1)
    return np.hypot(xx - (px + t * dx), yy - (py + t * dy))


def sword_mask(img):
    h, w = img.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r, g, b, a = (img[..., i].astype(int) for i in range(4))
    opaque = a > 0
    m = np.zeros((h, w), bool)
    for p, q, hw in CAPSULES:
        m |= seg_dist(xx, yy, p, q) <= hw
    (gx, gy), gr = GUARD
    m |= np.hypot(xx - gx, yy - gy) <= gr
    # 隣の鎧の赤い縅を巻き込まない（太刀は赤くない）
    red = (r > 165) & (g < 95) & (b < 95)
    m &= ~red
    # 手: 円の中の肌色（白い袖口や赤い房は除く）
    (hx, hy), hr = HAND
    sat = np.max(img[..., :3], axis=2).astype(int) - np.min(img[..., :3], axis=2).astype(int)
    luma = (r * 299 + g * 587 + b * 114) // 1000
    hand = (np.hypot(xx - hx, yy - hy) <= hr) & (sat > 30) & (luma > 150) & ~red
    m = (m | hand) & opaque
    # 帯の外に残る縁の暗い線（輪郭）も太刀として取る。暗い画素だけを 2 画素ぶん広げる
    near = m.copy()
    for _ in range(2):
        grown = near.copy()
        grown[1:, :] |= near[:-1, :]
        grown[:-1, :] |= near[1:, :]
        grown[:, 1:] |= near[:, :-1]
        grown[:, :-1] |= near[:, 1:]
        near = grown
    ink = opaque & (luma < 95) & ~red
    return m | (near & ink)


def fill_holes(body, mask):
    """太刀が抜けた跡を、同じ行の近くの絵から写して埋める。
    穴の両端の画素と最もつながりのよいブロック（左右 90 画素まで）を選ぶので、縞や文様が合いやすい。"""
    out = body.copy()
    h, w = mask.shape
    # 体の右の縁（太刀に隠れていない行から、隠れている行へ補間）。縁の外は透明のままにする
    right_edge = np.full(h, np.nan)
    for y in range(h):
        if mask[y].any():
            continue
        xs_opaque = np.nonzero(body[y, 420:, 3] > 0)[0]
        if len(xs_opaque):
            right_edge[y] = xs_opaque.max() + 420
    ok = ~np.isnan(right_edge)
    right_edge = np.interp(np.arange(h), np.nonzero(ok)[0], right_edge[ok])
    for y in range(h):
        row = mask[y]
        if not row.any():
            continue
        xs = np.nonzero(row)[0]
        runs = []
        start = prev = xs[0]
        for x in xs[1:]:
            if x != prev + 1:
                runs.append((start, prev))
                start = x
            prev = x
        runs.append((start, prev))
        for x0, x1 in runs:
            # 体の右の縁より外にある部分は、太刀が背景の前にあった所なので透明にする
            outside = x1 + 1 >= w or body[y, x1 + 1, 3] == 0
            if outside:
                edge = int(round(right_edge[y]))
                if x0 > edge:
                    out[y, x0:x1 + 1] = 0
                    continue
                if x1 > edge:
                    out[y, edge + 1:x1 + 1] = 0
                    x1 = edge
            n = x1 - x0 + 1
            left = body[y, x0 - 1].astype(int) if x0 > 0 and not mask[y, x0 - 1] else None
            right = body[y, x1 + 1].astype(int) if x1 + 1 < w and not mask[y, x1 + 1] else None
            best, best_cost = None, 1e18
            for sx0 in list(range(x0 - n - 3, max(-1, x0 - n - 93), -1)) + list(range(x1 + 4, min(w - n, x1 + 94))):
                if sx0 < 0 or sx0 + n > w or mask[y, sx0:sx0 + n].any() or not (body[y, sx0:sx0 + n, 3] > 200).all():
                    continue
                blk = body[y, sx0:sx0 + n].astype(int)
                cost = 0
                if left is not None:
                    cost += np.abs(blk[0] - left).sum()
                if right is not None:
                    cost += np.abs(blk[-1] - right).sum()
                cost += 0.02 * abs(sx0 - x0)          # 近いほうを少し優先
                if cost < best_cost:
                    best, best_cost = sx0, cost
            if best is not None:
                out[y, x0:x1 + 1] = body[y, best:best + n]
            else:
                out[y, x0:x1 + 1] = 0
    return out


def rotate_piece(piece, pivot, delta_deg, new_pivot):
    """部品を pivot を軸に delta_deg（画面で時計回りが正）回し、軸の位置を new_pivot に移す。"""
    c, s = math.cos(math.radians(delta_deg)), math.sin(math.radians(delta_deg))
    px, py = new_pivot
    ox, oy = pivot
    # 出力 (x', y') → 入力 (x, y): R(-Δ)(p' - new_pivot) + pivot
    coeffs = (c, s, -c * px - s * py + ox, -s, c, s * px - c * py + oy)
    im = walk.pre(Image.fromarray(piece, "RGBA")).transform(piece.shape[1::-1], Image.AFFINE, coeffs, Image.BICUBIC)
    return im.convert("RGBA")


def body_map_point(p, dx_b, lean, bob):
    x, y = p
    return (x - dx_b - lean * (Y_REF - y) / (Y_REF - Y_HEAD), y - bob)


def transform_body(body, dx_b, lean, bob):
    hh = Y_REF - Y_HEAD
    coeffs = (1.0, -lean / hh, dx_b + lean * (Y_REF - bob) / hh, 0.0, 1.0, float(bob))
    im = walk.pre(Image.fromarray(body, "RGBA")).transform(body.shape[1::-1], Image.AFFINE, coeffs, Image.BICUBIC)
    return im.convert("RGBA")


# コマごとの動き。dx_b: 体を前（画面の左）へ出す量、lean: 頭を前へ傾ける量、bob: 体の上下（負で沈む）
# sword_deg: 鞘の向き（画面で x 軸から時計回り。右下 = 37.4）、feet: (左脚, 右脚) の足の前後（前が正）
FRAMES = [
    dict(name="構え", dx_b=-4, lean=-10, bob=0, sword_deg=-20, feet=(14, -14)),
    dict(name="振りかぶり", dx_b=-14, lean=-20, bob=0, sword_deg=-70, feet=(6, -24)),
    dict(name="斬り下ろし", dx_b=46, lean=30, bob=-12, sword_deg=118, feet=(66, -40)),
    dict(name="残心", dx_b=34, lean=16, bob=-8, sword_deg=100, feet=(62, -34)),
]


def render(layers, fr, only_sword=False):
    body, sword, shins, w, h = layers
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dx_b, lean, bob = (0, 0, 0) if only_sword else (fr["dx_b"], fr["lean"], fr["bob"])
    if not only_sword:
        for name, fo in zip(("left", "right"), fr["feet"]):
            piece, y_h, foot_bottom = shins[name]
            leg = walk.warp_leg(piece, y_h, foot_bottom, fo - dx_b, 0.0, bob)
            moved = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            moved.paste(leg, (-int(round(dx_b)), 0))
            canvas.alpha_composite(moved)
    canvas.alpha_composite(transform_body(body, dx_b, lean, bob))
    pivot2 = body_map_point(PIVOT, dx_b, lean, bob)
    canvas.alpha_composite(rotate_piece(sword, PIVOT, fr["sword_deg"] - SWORD_DIR_DEG, pivot2))
    return canvas


def build_layers(img):
    cuts = walk.find_cut_lines(img)
    body0, shins = walk.split_layers(img, cuts)
    mask = sword_mask(body0)
    sword = np.zeros_like(body0)
    sword[mask] = body0[mask]
    body = fill_holes(body0, mask)
    h, w = img.shape[:2]
    return body, sword, shins, w, h, mask


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("master")
    ap.add_argument("outdir")
    ap.add_argument("--proto", action="store_true", help="斬り下ろしの 1 コマだけ（太刀を回すだけ）を作る")
    a = ap.parse_args()
    os.makedirs(a.outdir, exist_ok=True)
    img = np.array(Image.open(a.master).convert("RGBA"))
    body, sword, shins, w, h, mask = build_layers(img)
    layers = (body, sword, shins, w, h)
    print(f"太刀の部品: {int(mask.sum())} 画素")
    if a.proto:
        Image.fromarray(body, "RGBA").save(os.path.join(a.outdir, "proto_body_only.png"))
        for i in (0, 1, 2):
            render(layers, FRAMES[i], only_sword=True).save(os.path.join(a.outdir, f"proto_{i + 1}.png"))
        return
    for i, fr in enumerate(FRAMES):
        render(layers, fr).save(os.path.join(a.outdir, f"{i + 1:02d}.png"))
        print(f"{i + 1:02d}.png  {fr['name']}")


if __name__ == "__main__":
    main()
