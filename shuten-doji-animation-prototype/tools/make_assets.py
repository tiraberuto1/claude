#!/usr/bin/env python3
"""酒伝童子絵巻「絵が動く」プロトタイプ用アセット生成スクリプト。

scroll_original.png から
  1. 左下の武者を切り抜き (元画像のピクセルをそのまま保持)
  2. 人物を除去した背景 scroll_background_clean.png を作り
  3. 切り抜いた人物を部位ごとに少しだけ動かした 8 フレームを書き出す。

座標はすべて scroll_original.png (2048x914) のピクセル座標。
再生成: python3 tools/make_assets.py   (要 numpy / opencv-python / pillow)
"""
import os
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets/scroll/scroll_original.png")
OUT_BG = os.path.join(ROOT, "assets/scroll/scroll_background_clean.png")
OUT_DIR = os.path.join(ROOT, "assets/characters/samurai_left_bottom")
OUT_MASK = os.path.join(ROOT, "tools/mask_samurai.png")
PREVIEW_DIR = os.path.join(ROOT, "tools/preview")

# 武者スプライトのキャンバス (元画像座標)。刀を振っても切れない余白を含む。
CX0, CY0, CX1, CY1 = 0, 120, 580, 700
CW, CH = CX1 - CX0, CY1 - CY0


def K(r):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


# ---------------------------------------------------------------- 人物マスク
# 手描きの大まかなポリゴン + GrabCut で境界を詰める。
BODY = [(211, 357), (240, 345), (300, 349), (343, 352), (365, 372), (395, 369), (430, 374), (447, 392), (460, 412),
        (470, 430), (475, 440), (490, 470), (510, 500), (513, 522), (524, 517), (536, 515), (548, 520), (553, 528), (552, 540), (545, 555), (520, 565),
        (495, 560), (478, 548), (455, 520), (440, 520), (420, 540), (405, 560), (420, 580), (428, 592), (422, 610),
        (395, 632), (370, 632), (340, 625), (320, 626), (300, 626), (280, 635), (268, 622), (250, 616), (225, 632),
        (205, 632), (200, 615), (195, 590), (172, 580), (168, 590), (155, 610), (135, 628), (112, 645), (100, 660),
        (82, 658), (62, 642), (45, 628), (38, 614), (45, 601), (58, 600), (70, 608), (85, 612), (100, 610), (112, 603),
        (122, 590), (128, 577), (134, 562), (137, 556), (125, 540), (120, 520), (125, 495), (150, 490), (160, 480),
        (170, 470), (190, 470), (200, 440), (208, 410), (212, 370)]
SWORD = [(30, 171), (34, 172), (46, 198), (58, 226), (71, 254), (84, 281), (98, 306), (113, 331), (126, 357), (134, 378),
         (140, 383), (155, 385), (155, 398), (145, 406), (165, 425), (185, 450), (200, 470), (196, 476), (188, 468),
         (170, 448), (150, 425), (140, 408), (122, 405), (118, 392), (126, 382), (124, 372), (112, 350), (98, 326),
         (83, 300), (70, 276), (58, 250), (46, 224), (36, 200), (29, 177)]
SCABBARD = [(85, 436), (97, 432), (112, 442), (135, 458), (158, 470), (168, 482), (150, 482), (125, 470), (100, 453),
            (88, 446)]
HAND_SLEEVE = [(133, 402), (150, 398), (172, 398), (195, 396), (212, 392), (215, 440), (200, 455), (175, 445),
               (165, 438), (150, 436), (138, 428)]
TANTO = [(385, 538), (410, 540), (440, 544), (453, 548), (450, 556), (436, 554), (425, 553), (405, 548), (388, 548)]
BLADE_ZONE_Y1 = 392   # これより上が刀身 (y<392) の範囲
# 足元で武者の背後にある梁 (背景) を除外する
BEAM_EXCLUDE = [(0, 520), (120, 552), (137, 556), (132, 566), (126, 580), (120, 596), (113, 608), (100, 612),
                (85, 612), (70, 607), (57, 602), (45, 601), (30, 606), (0, 625)]
# 手の右下にかかる畳縁 (背景) を除外する
STRIP_EXCLUDE = [(541, 549), (556, 545), (556, 566), (541, 566)]


def poly_mask(shape, pts):
    m = np.zeros(shape[:2], np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 1)
    return m


def grabcut(bgr, pts, erode, dilate, iters=6):
    p = poly_mask(bgr.shape, pts)
    mask = np.full(p.shape, cv2.GC_BGD, np.uint8)
    mask[cv2.dilate(p, K(dilate)) > 0] = cv2.GC_PR_BGD
    mask[p > 0] = cv2.GC_PR_FGD
    mask[cv2.erode(p, K(erode)) > 0] = cv2.GC_FGD
    a = np.zeros((1, 65))
    b = np.zeros((1, 65))
    cv2.grabCut(bgr, mask, None, a, b, iters, cv2.GC_INIT_WITH_MASK)
    return ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8)


def build_mask(rgb):
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    H = rgb.shape[0]
    # 刀身は 黄土色の地 との色差 (青灰/暗色) で抜く。GrabCut より輪郭が正確。
    corridor = cv2.dilate(poly_mask(rgb.shape, SWORD), K(8))
    r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    lum = (r + g + b) / 3
    cls = ((b >= r - 12) | (lum < 105)).astype(np.uint8)
    blade = corridor * cls
    # 赤茶の刃縁など: 回廊を周囲から補間した「刀が無い場合の地」との差で拾う
    tight = corridor                                   # 刀身の赤茶の帯 (鎬) まで拾うため広めに取る
    wide = cv2.dilate(poly_mask(rgb.shape, SWORD), K(12))
    expect = cv2.inpaint(bgr, wide * 255, 5, cv2.INPAINT_TELEA)
    far = np.abs(bgr.astype(int) - expect.astype(int)).max(axis=2) > 28
    green = (g > r + 20) & (g >= b + 8)                      # 草の緑 (刀身の青灰は b > g なので入らない)
    ochre = (r > g + 10) & (g > b + 25) & (lum > 100)        # 黄土色の地 (赤茶の帯は g-b が小さいので入らない)
    blade = np.maximum(blade, (tight * far).astype(np.uint8)) * (~green) * (~ochre)
    blade = blade.astype(np.uint8)
    blade[390:] = 0
    blade = cv2.morphologyEx(blade, cv2.MORPH_OPEN, K(1))
    blade = cv2.morphologyEx(blade, cv2.MORPH_CLOSE, K(2))
    n, lab, st, _ = cv2.connectedComponentsWithStats(blade)
    if n > 1:
        blade = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
    blade = cv2.dilate(blade, K(1))
    blade[390:] = 0
    # 草の筆線などが刀身から飛び出した突起を落とす: 本体 (半径3で開いたもの) の 2px 外までに限る。
    # 輪郭線は本体の 1〜2px 外にあるので残る。切先 (y<185) は細いのでそのまま残す。
    core = cv2.morphologyEx(blade, cv2.MORPH_OPEN, K(3))
    keep = cv2.dilate(core, K(2))
    keep[:185] = 1
    blade = blade * keep
    sword_low = grabcut(bgr, SWORD, 2, 5) * (np.arange(H)[:, None] >= 380)
    m = (grabcut(bgr, BODY, 7, 9) | grabcut(bgr, HAND_SLEEVE, 3, 5) | blade | sword_low
         | grabcut(bgr, SCABBARD, 2, 4) | poly_mask(rgb.shape, TANTO))
    m[:, 554:] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, K(2))
    m[poly_mask(rgb.shape, BEAM_EXCLUDE) > 0] = 0
    m[poly_mask(rgb.shape, STRIP_EXCLUDE) > 0] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, K(1))
    # 内部の穴を埋める
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros_like(m)
    cv2.drawContours(filled, cs, -1, 1, -1)
    return peel_background(rgb, filled)


def peel_background(rgb, mask, thresh=22, max_iter=16):
    """マスクの縁に混ざった背景 (畳の緑・黄土色) を外側から 1px ずつ剥がす。
    周囲から補間した「人物が無い場合の地」との色差が小さい縁の画素だけを外す。
    人物の線・彩色は地との色差が大きいので残る。"""
    est = build_clean_plate(rgb, mask, add_noise=False).astype(np.int16)
    diff = np.abs(rgb.astype(np.int16) - est).max(axis=2)
    cross = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
    m = mask.copy()
    blade_zone = cv2.dilate(poly_mask(rgb.shape, SWORD), K(8)) > 0
    blade_zone[BLADE_ZONE_Y1:] = False
    for _ in range(max_iter):
        edge = (m > 0) & (cv2.erode(m, cross) == 0)
        rem = edge & (diff <= thresh) & ~blade_zone
        if not rem.any():
            break
        m[rem] = 0
    # 剥がした結果できた孤立した小片を除く
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    for i in range(1, n):
        if st[i, 4] < 40:
            m[lab == i] = 0
    return m


# ---------------------------------------------------------------- 背景復元
def build_clean_plate(rgb, mask, add_noise=True):
    """人物を除去した背景。周囲の色を Telea 法で回して埋める。
    パッチコピー系の手法は鬼の顔などを複製してしまうため使わない。"""
    hole = cv2.dilate(mask, K(1))
    # 刀身のまわりは穴を広げ、元の刀の縁や影が背景に残らないようにする
    blade = mask.copy()
    blade[BLADE_ZONE_Y1:] = 0
    blade[:, 175:] = 0
    hole = np.maximum(hole, cv2.dilate(blade, K(4)))
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    x0, y0, x1, y1 = 0, 100, 640, 740
    crop = bgr[y0:y1, x0:x1].copy()
    filled = cv2.inpaint(crop, hole[y0:y1, x0:x1], 5, cv2.INPAINT_TELEA)
    # 刀身のあとは、周囲の地の模様をたどる周波数選択的な補間 (FSR) で埋める。
    # Telea だと、近くの雲の縁 (灰色の線) の色を引っ張って灰色のにじみが出るため。
    wx0, wy0, wx1, wy1 = 0, 150, 190, 400
    win = bgr[wy0:wy1, wx0:wx1]
    wh = hole[wy0:wy1, wx0:wx1]
    zone = np.zeros_like(wh)
    zone[:BLADE_ZONE_Y1 - wy0, :175] = 1
    blade_hole = (wh * zone) > 0
    filled_w = np.zeros_like(win)
    cv2.xphoto.inpaint(win, ((1 - wh) * 255).astype(np.uint8), filled_w, cv2.xphoto.INPAINT_FSR_FAST)
    filled[wy0 - y0:wy1 - y0, wx0 - x0:wx1 - x0][blade_hole] = filled_w[blade_hole]
    # 紙の粒状感をあわせる (穴の周囲の高周波成分から標準偏差を推定)
    ring = (cv2.dilate(hole, K(12)) - cv2.dilate(hole, K(4)))[y0:y1, x0:x1] > 0
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY).astype(np.float32)
    hp = gray - cv2.GaussianBlur(gray, (0, 0), 2.0)
    # 外れ値(線や縁)に引きずられないよう MAD でノイズ量を推定
    sigma = float(1.4826 * np.median(np.abs(hp[ring] - np.median(hp[ring]))))
    rng = np.random.default_rng(7)
    noise = cv2.GaussianBlur(rng.normal(0, 1, gray.shape).astype(np.float32), (0, 0), 0.8)
    noise *= sigma / max(noise.std(), 1e-6)
    hm = hole[y0:y1, x0:x1] > 0
    out = filled.astype(np.float32)
    if add_noise:
        out[hm] += noise[hm][:, None]
    plate = bgr.copy()
    plate[y0:y1, x0:x1] = np.clip(out, 0, 255).astype(np.uint8)
    return cv2.cvtColor(plate, cv2.COLOR_BGR2RGB)


# ---------------------------------------------------------------- アニメーション
# 部位ポリゴン (元画像座標)
HEAD_POLY = [(345, 372), (440, 372), (472, 415), (470, 440), (440, 452), (395, 455), (355, 440), (345, 410)]
# 右腕の前腕 (籠手) と手
FOREARM_POLY = [(467, 503), (480, 498), (495, 505), (506, 520), (514, 528), (524, 518), (538, 517), (552, 524),
                (556, 532), (554, 548), (548, 567), (526, 574), (504, 572), (488, 570), (484, 556), (492, 547),
                (484, 538), (474, 522)]
# 刀 = 刀身+鍔 (y<400, x<175) + 握っている手 + 手の下に出ている柄。握りを中心に一体で回す
SWORD_TOP_REGION = (400, 175)   # y<400 かつ x<175
HAND_POLY = [(128, 402), (150, 399), (165, 400), (172, 412), (172, 425), (166, 433), (150, 438), (138, 436),
             (130, 428), (126, 412)]
SWORD_TAIL_POLY = [(159, 428), (170, 428), (174, 436), (181, 445), (194, 458), (198, 466), (182, 466), (175, 456),
                   (165, 439), (159, 432)]
CLOTH_SKIRT = [(190, 520), (430, 520), (430, 640), (190, 640)]
CLOTH_SLEEVE = [(168, 395), (236, 395), (236, 458), (168, 458)]

FOOT = (95.0, 655.0)     # 足元の基準点 (胴体の傾きの回転中心 = 全フレーム固定)
ELBOW = (478.0, 500.0)   # 右前腕の回転中心
GRIP = (152.0, 418.0)    # 刀の回転中心 (握り)
HEAD_C = (410.0, 410.0)

# フレームごとのパラメータ: 傾き(度,時計回り+) / 裾の揺れ(px) / 右前腕(度) / 刀(度) / 表示時間(ms)
FRAMES = [
    dict(lean=0.0, sway=0.0, fore=0.0, sword=0.0, ms=120),    # 01 元の構え
    dict(lean=0.35, sway=0.5, fore=-1.0, sword=-1.0, ms=100),  # 02 わずかに前傾
    dict(lean=0.5, sway=1.0, fore=-3.0, sword=-2.0, ms=100),   # 03 上半身・腕を少し動かす
    dict(lean=0.3, sway=1.5, fore=-2.0, sword=-6.0, ms=80),    # 04 刀を少し上げる
    dict(lean=0.8, sway=2.0, fore=2.0, sword=7.0, ms=60),      # 05 刀を振る
    dict(lean=1.0, sway=-1.5, fore=4.0, sword=15.0, ms=180),   # 06 振り切る
    dict(lean=0.4, sway=-0.5, fore=1.5, sword=5.0, ms=120),    # 07 元の姿勢へ戻る
    dict(lean=0.0, sway=0.0, fore=0.0, sword=0.0, ms=200),     # 08 元の構え
]


def rot_about(deg, c):
    """c を中心に deg 度 (画像座標で時計回りが +) 回す 2x3 アフィン行列 (src→dst)。"""
    t = np.deg2rad(deg)
    cs, sn = np.cos(t), np.sin(t)
    cx, cy = c
    return np.array([[cs, -sn, cx - cs * cx + sn * cy],
                     [sn, cs, cy - sn * cx - cs * cy]], np.float64)


def compose(a, b):
    """a を適用したあとに b を適用する 2x3 行列。"""
    A = np.vstack([a, [0, 0, 1]])
    B = np.vstack([b, [0, 0, 1]])
    return (B @ A)[:2]


def shift(pts, dx=0, dy=0):
    return [(x + dx, y + dy) for x, y in pts]


def to_canvas(pts):
    return shift(pts, -CX0, -CY0)


def canvas_pt(p):
    return (p[0] - CX0, p[1] - CY0)


class Rig:
    def __init__(self, sprite_premul, mask_canvas, keep_joints=()):
        self.P = sprite_premul                       # float32 HxWx4 (premultiplied)
        h, w = self.P.shape[:2]
        self.h, self.w = h, w
        shp = (h, w)
        m = mask_canvas > 0
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        self.xx, self.yy = xx, yy
        # 切り離す部位 (ハードマスク)
        sword_top = (yy < 400 - CY0) & (xx < SWORD_TOP_REGION[1] - CX0) & m
        sword_tail = (poly_mask(shp, to_canvas(SWORD_TAIL_POLY)) > 0) & m
        sword_hand = (poly_mask(shp, to_canvas(HAND_POLY)) > 0) & m
        forearm = (poly_mask(shp, to_canvas(FOREARM_POLY)) > 0) & m
        self.parts = {
            "sword": sword_top | sword_tail | sword_hand,
            "fore": forearm,
        }
        cut = self.parts["sword"] | self.parts["fore"]
        # 関節付近 (中心, 半径) は土台に残す。回した部位の下で継ぎ目が透けるのを防ぐ
        for cx, cy, r in keep_joints:
            cut &= ((xx - (cx - CX0)) ** 2 + (yy - (cy - CY0)) ** 2) > r * r
        self.base = self.P * (~cut)[..., None]
        # 布の揺れ・頭の補正用の重み
        def soft(pts, s):
            return cv2.GaussianBlur(poly_mask(shp, to_canvas(pts)).astype(np.float32), (0, 0), s)
        ramp = np.clip((yy + CY0 - 535.0) / 100.0, 0, 1) ** 2
        self.w_skirt = soft(CLOTH_SKIRT, 5) * ramp
        self.w_sleeve = soft(CLOTH_SLEEVE, 4) * 0.6
        self.w_head = soft(HEAD_POLY, 8)

    def render(self, lean, sway, fore, sword):
        h, w = self.h, self.w
        F = canvas_pt(FOOT)
        M_lean = rot_about(lean, F)
        # --- 胴体・頭・衣服: 連続的な変形 (dst→src の逆写像)
        inv = cv2.invertAffineTransform(M_lean)
        qx = inv[0, 0] * self.xx + inv[0, 1] * self.yy + inv[0, 2]
        qy = inv[1, 0] * self.xx + inv[1, 1] * self.yy + inv[1, 2]
        # 頭は胴体の動きの 70% を打ち消して「ほぼ固定」にする
        hc = np.array([*canvas_pt(HEAD_C), 1.0])
        d_head = -0.7 * (M_lean @ hc - hc[:2])
        dx = sway * (self.w_skirt + self.w_sleeve) + d_head[0] * self.w_head
        dy = d_head[1] * self.w_head + 0.4 * sway * self.w_sleeve
        sx = (qx - dx).astype(np.float32)
        sy = (qy - dy).astype(np.float32)
        base = cv2.remap(self.base, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        out = base
        # --- 切り離した部位 (剛体として回転)。胴体の傾きも重ねる
        for name, angle, pivot in (("fore", fore, ELBOW), ("sword", sword, GRIP)):
            M = compose(rot_about(angle, canvas_pt(pivot)), M_lean)
            layer = cv2.warpAffine(self.P * self.parts[name][..., None], M, (w, h), flags=cv2.INTER_LINEAR,
                                   borderMode=cv2.BORDER_CONSTANT, borderValue=0)
            out = layer + out * (1.0 - layer[..., 3:4])
        return out


def premul_to_rgba8(p):
    a = p[..., 3:4]
    rgb = np.where(a > 1e-4, p[..., :3] / np.maximum(a, 1e-4), 0)
    return np.clip(np.concatenate([rgb, a * 255.0], axis=-1) + 0.5, 0, 255).astype(np.uint8)


def composite_on(plate_rgb, sprite_rgba8):
    """確認用: 背景の上に (CX0,CY0) を原点として重ねる。"""
    out = plate_rgb.astype(np.float32).copy()
    a = sprite_rgba8[..., 3:4].astype(np.float32) / 255.0
    region = out[CY0:CY1, CX0:CX1]
    out[CY0:CY1, CX0:CX1] = sprite_rgba8[..., :3] * a + region * (1 - a)
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    rgb = np.array(Image.open(SRC).convert("RGB"))

    mask = build_mask(rgb)
    Image.fromarray(mask * 255).save(OUT_MASK)

    # スプライトは輪郭の AA 画素を含めるため 2px 太らせる
    # ただし刀身のまわりは太らせない (元絵の明るい地の画素が付いて、動かすと淡い縁取りに見えるため)
    grown = cv2.dilate(mask, K(2))
    blade_zone = np.zeros_like(mask, bool)
    blade_zone[:BLADE_ZONE_Y1, :175] = True
    mask = np.where(blade_zone, mask, grown).astype(np.uint8)
    plate = build_clean_plate(rgb, mask)
    Image.fromarray(plate).save(OUT_BG)

    # 切り抜き: 元ピクセルをそのまま保持 (再彩色・ぼかしなし)。マスク内 alpha=1、外 0。
    # 動かすときの縁は warp の補間で自然にアンチエイリアスされる。
    alpha = mask.astype(np.float32)
    rgba = np.dstack([rgb.astype(np.float32), alpha * 255.0])
    sprite_full = rgba[CY0:CY1, CX0:CX1]
    P = np.dstack([sprite_full[..., :3] * (sprite_full[..., 3:4] / 255.0), sprite_full[..., 3:4] / 255.0]).astype(np.float32)
    # samurai_01 用に元の切り抜きも保持
    rig = Rig(P, mask[CY0:CY1, CX0:CX1])

    frames = []
    for i, prm in enumerate(FRAMES, 1):
        p = rig.render(prm["lean"], prm["sway"], prm["fore"], prm["sword"])
        img = premul_to_rgba8(p)
        Image.fromarray(img, "RGBA").save(os.path.join(OUT_DIR, f"samurai_{i:02d}.png"))
        frames.append(img)
        Image.fromarray(composite_on(plate, img)[CY0:CY1, CX0:CX1]).save(
            os.path.join(PREVIEW_DIR, f"frame_{i:02d}.png"))

    # 確認: フレーム 1 を背景に重ねると元絵と一致するか
    rec = composite_on(plate, frames[0])
    diff = np.abs(rec.astype(int) - rgb.astype(int)).max(axis=2)
    print("frame01 と元絵の最大差:", int(diff.max()), " 差>8 の画素数:", int((diff > 8).sum()))

    # 動きの確認用 GIF (実際の表示時間で)
    gif = [Image.fromarray(composite_on(plate, f)[CY0 - 20:CY1, CX0:CX1]) for f in frames]
    gif[0].save(os.path.join(PREVIEW_DIR, "preview.gif"), save_all=True, append_images=gif[1:],
                duration=[p["ms"] for p in FRAMES], loop=0)
    print("done")


if __name__ == "__main__":
    main()
