"""武者を除いた背景 scroll_background_clean.png を作る。

穴を元絵の構造で領域分けし、領域ごとに埋め方を変える。
  A 金地＋草      : 同じ領域だけを探索元にしたパッチ補完（Criminisi 法）
  B 梁（敷居）    : 梁の方向に沿って見えている部分を写す
  C 梁の下の畳縁  : 同上（黒点の周期を保つ）
  D 緑の床        : パッチ補完
  E 右手の下の点線: 点線の方向に沿って写す（黒点の周期を保つ）
梁は左下で見えている部分の延長として、武者と鬼の首の後ろを通り柱の根元へ至るものとした。
"""
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/scroll/scroll_original.png"
MASK = ROOT / "assets/characters/samurai_left_bottom/samurai_mask.png"
OUT = ROOT / "assets/scroll/scroll_background_clean.png"

ROI = (0, 130, 640, 710)          # 作業範囲 x0, y0, x1, y1
SLOPE = -0.70                     # 梁・畳縁・点線に共通の傾き（遠近の平行線）
BEAM_TOP_Y0 = 631.5               # 梁上端 y = BEAM_TOP_Y0 + SLOPE * x
BEAM_T, STRIP_T = 31, 47          # 梁上端からの縦距離: 梁(黒線含む) / 畳縁 の下端
DOT_LINE = (380, 670, -0.71)      # 右手の下の点線: (x0, y0, slope)
DOT_X_MIN = 300
DOT_HALF = 8
DOT_PERIOD_X = 17.2               # 黒点の x 方向の周期
BEAM_REF_X = (0, 33)              # 梁の全幅が見えている区間（足の左）
PATCH = 9
# パッチの取得元にしない物（複製されると不自然なもの）
SOURCE_EXCLUDE = [
    [(140, 130), (640, 130), (640, 395), (270, 395), (270, 300), (230, 270), (140, 215)],  # 鬼の首と髪
    [(425, 340), (585, 340), (585, 515), (425, 515)],   # 青い斧の刃
    [(440, 600), (548, 600), (548, 710), (440, 710)],   # 椀
    [(240, 630), (312, 630), (312, 690), (240, 690)],   # 血の染み
    [(0, 686), (640, 686), (640, 710), (0, 710)],       # 下端の点線と雲
    [(522, 560), (566, 560), (566, 640), (522, 640)],   # 椀の上の赤い煙
]
SEARCH = 140
HALO = 3                          # 穴の縁のにじみは取得元にしない
FLOOR_HSV = ((22, 45), 40, 100)   # 床の緑: 色相範囲, 最低彩度, 最低明度
FLOOR_MARGIN = 3

A, B, C, D, E = 1, 2, 3, 4, 5


def zone_map(shape, ox, oy):
    """ROI 内の各画素を背景構造 A〜E に分類する。"""
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    xx += ox
    yy += oy
    t = yy - (BEAM_TOP_Y0 + SLOPE * xx)
    z = np.full((h, w), D, np.uint8)
    z[t < STRIP_T] = C
    z[t < BEAM_T] = B
    z[t < 0] = A
    x0, y0, s = DOT_LINE
    e = (np.abs(yy - (y0 + s * (xx - x0))) <= DOT_HALF) & (xx > DOT_X_MIN) & (z == D)
    z[e] = E
    return z


def directional_fill(img, known, hole, zone, zid, slope, shifts):
    """穴の画素を、帯の方向に shifts だけずらした既知画素から写す。"""
    ys, xs = np.where(hole & (zone == zid))
    h, w = zone.shape
    filled = np.zeros_like(hole)
    for y, x in zip(ys, xs):
        for dx in shifts:
            sx, sy = x + dx, y + slope * dx
            ix, iy = int(round(sx)), int(round(sy))
            if 0 <= ix < w - 1 and 0 <= iy < h - 1 and known[iy, ix] and zone[iy, ix] == zid:
                img[y, x] = cv2.getRectSubPix(img, (1, 1), (float(sx), float(sy)))[0, 0]
                filled[y, x] = True
                break
    return filled


def mirror_fill(img, hole, zone, zid, slope, ref, ox):
    """ref 区間を帯の方向に沿って折り返しながら敷き詰める（継ぎ目が出ない）。"""
    a, b = ref[0] - ox, ref[1] - ox
    L = b - a
    ys, xs = np.where(hole & (zone == zid))
    t = np.mod(xs - a, 2 * L)
    sx = a + np.where(t < L, t, 2 * L - t).astype(np.float32)
    sy = ys + slope * (sx - xs)
    mapx = sx.reshape(-1, 1).astype(np.float32)
    mapy = sy.reshape(-1, 1).astype(np.float32)
    img[ys, xs] = cv2.remap(img, mapx, mapy, cv2.INTER_LINEAR)[:, 0]
    return hole & (zone == zid)


def criminisi(img, known, hole, zone, zid, excluded, floor):
    """同じ領域内の既知パッチだけを探索元にして穴を埋める。"""
    r = PATCH // 2
    h, w = zone.shape
    target = hole & (zone == zid)
    src_ok = known & (zone == zid) & ~excluded
    if zid == D:
        src_ok &= floor
    conf = src_ok.astype(np.float32)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    while target.any():
        valid = (known | (zone != zid)) & ~target
        front = target & (cv2.dilate(valid.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)
        fy, fx = np.where(front)
        # 優先度 = 信頼度 × 等輝度線の強さ
        gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        cbox = cv2.boxFilter(conf, -1, (PATCH, PATCH), normalize=True)
        tm = target.astype(np.float32)
        nx = cv2.Sobel(tm, cv2.CV_32F, 1, 0, ksize=3)
        ny = cv2.Sobel(tm, cv2.CV_32F, 0, 1, ksize=3)
        nn = np.sqrt(nx ** 2 + ny ** 2) + 1e-6
        data = np.abs(-gy * nx / nn + gx * ny / nn) / 255.0 + 0.01
        pri = cbox[fy, fx] * data[fy, fx]
        i = int(np.argmax(pri))
        py, px = int(fy[i]), int(fx[i])

        y0, y1 = max(py - r, 0), min(py + r + 1, h)
        x0, x1 = max(px - r, 0), min(px + r + 1, w)
        tpl = img[y0:y1, x0:x1].astype(np.float32)
        tmask = (src_ok[y0:y1, x0:x1] | (known[y0:y1, x0:x1] & ~target[y0:y1, x0:x1]
                 & (zone[y0:y1, x0:x1] == zid))).astype(np.float32)
        ph, pw = y1 - y0, x1 - x0

        sy0, sy1 = max(py - SEARCH, 0), min(py + SEARCH, h)
        sx0, sx1 = max(px - SEARCH, 0), min(px + SEARCH, w)
        region = img[sy0:sy1, sx0:sx1].astype(np.float32)
        okwin = cv2.erode(src_ok[sy0:sy1, sx0:sx1].astype(np.uint8),
                          np.ones((ph, pw), np.uint8), anchor=(0, 0), borderValue=0)
        okwin = okwin[:region.shape[0] - ph + 1, :region.shape[1] - pw + 1]
        if tmask.sum() == 0 or okwin.max() == 0:
            # 手がかりが無い: 近傍の既知画素の平均で埋める
            sel = target[y0:y1, x0:x1]
            patch_src = img[sy0:sy1, sx0:sx1][src_ok[sy0:sy1, sx0:sx1]]
            img[y0:y1, x0:x1][sel] = patch_src.mean(0) if len(patch_src) else 0
        else:
            cost = cv2.matchTemplate(region, tpl, cv2.TM_SQDIFF, mask=np.dstack([tmask] * 3))
            cost[okwin == 0] = np.inf
            by, bx = np.unravel_index(int(np.argmin(cost)), cost.shape)
            src = img[sy0 + by:sy0 + by + ph, sx0 + bx:sx0 + bx + pw]
            sel = target[y0:y1, x0:x1]
            img[y0:y1, x0:x1][sel] = src[sel]
        sel = target[y0:y1, x0:x1].copy()
        conf[y0:y1, x0:x1][sel] = cbox[py, px]
        known[y0:y1, x0:x1][sel] = True
        target[y0:y1, x0:x1][sel] = False
        gray[y0:y1, x0:x1] = cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)


def main():
    rgba = cv2.imread(str(SRC), cv2.IMREAD_UNCHANGED)
    mask = cv2.imread(str(MASK), 0) > 0

    rx0, ry0, rx1, ry1 = ROI
    img = rgba[ry0:ry1, rx0:rx1, :3].copy()
    hole = mask[ry0:ry1, rx0:rx1].copy()
    known = ~hole
    known0 = known.copy()
    zone = zone_map(hole.shape, rx0, ry0)

    excl = np.zeros(hole.shape, np.uint8)
    for p in SOURCE_EXCLUDE:
        cv2.fillPoly(excl, [np.array(p, np.int32) - (rx0, ry0)], 1)
    halo = cv2.dilate(hole.astype(np.uint8), np.ones((2 * HALO + 1,) * 2, np.uint8)) > 0
    excluded = (excl > 0) | halo
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    (hlo, hhi), smin, vmin = FLOOR_HSV
    green = ((hsv[..., 0] >= hlo) & (hsv[..., 0] <= hhi) & (hsv[..., 1] >= smin)
             & (hsv[..., 2] >= vmin)).astype(np.uint8)
    floor = cv2.erode(green, np.ones((2 * FLOOR_MARGIN + 1,) * 2, np.uint8)) > 0
    img[hole] = 0
    dots = [DOT_PERIOD_X * n for n in range(1, 40)]
    f = mirror_fill(img, hole, zone, B, SLOPE, BEAM_REF_X, rx0)
    known |= f
    hole &= ~f
    for zid, slope, shifts in (
        (C, SLOPE, [-s for s in dots]),
        (E, DOT_LINE[2], [v for n in range(4, 9) for v in (-DOT_PERIOD_X * n, DOT_PERIOD_X * n)]),
    ):
        f = directional_fill(img, known, hole, zone, zid, slope, shifts)
        known |= f
        hole &= ~f
    for zid in (A, D, B, C, E):
        criminisi(img, known, hole, zone, zid, excluded, floor)

    out = rgba.copy()
    out[ry0:ry1, rx0:rx1, :3] = img
    cv2.imwrite(str(OUT), out)
    print(f"filled {int((~known0).sum())} px")


if __name__ == "__main__":
    main()
