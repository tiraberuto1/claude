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
WEDGE_OCHRE = [(156, 390), (218, 390), (218, 398), (190, 399), (176, 405), (168, 404), (160, 399)]   # 鍔と袖の間の地
ARMOR_TIP = [(434, 527), (457, 527), (460, 541), (457, 548), (440, 547), (433, 540)]   # 鎧の裾の右端
BLADE_ZONE_Y1 = 392   # これより上が刀身 (y<392) の範囲
# 縁の背景を剥がす処理から外す部位 (橙・肌色・暗色が、補間した地と近く見えて削られるため)
PEEL_PROTECT = [
    [(385, 536), (412, 538), (441, 540), (456, 546), (454, 557), (436, 556), (425, 554), (405, 550), (388, 549)],  # 短刀
    [(415, 515), (482, 515), (482, 545), (455, 546), (425, 546), (415, 540)],                                   # 鎧の裾の右端
    [(516, 536), (520, 516), (548, 512), (560, 522), (560, 540), (557, 574), (526, 578), (486, 572), (486, 540)],  # 右の手 (籠手の脇の地は含めない)
    [(116, 376), (160, 374), (176, 396), (176, 440), (150, 442), (124, 434), (118, 406)],                       # 鍔と握る手
]
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
    blade[390:] = 0
    # 草の筆線などが刀身から飛び出した突起を落とす: 本体 (半径3で開いたもの) の 2px 外までに限る。
    # 輪郭線は本体の 1〜2px 外にあるので残る。切先 (y<185) は細いのでそのまま残す。
    core = cv2.morphologyEx(blade, cv2.MORPH_OPEN, K(3))
    keep = cv2.dilate(core, K(2))
    keep[:176] = 1
    blade = blade * keep
    sword_low = grabcut(bgr, SWORD, 2, 5) * (np.arange(H)[:, None] >= 380)
    m = (grabcut(bgr, BODY, 7, 9) | grabcut(bgr, HAND_SLEEVE, 3, 5) | blade | sword_low
         | grabcut(bgr, SCABBARD, 2, 4) | poly_mask(rgb.shape, TANTO))
    # 鎧の裾の右端と短刀の柄の上: GrabCut が取りこぼして背景に残り、動かすと取り残されていた
    tatami = (g >= b + 15) & (np.abs(r - g) < 45) & (g > 110)
    m |= (poly_mask(rgb.shape, ARMOR_TIP) > 0) & ~tatami
    m[:, 554:] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, K(2))
    m[poly_mask(rgb.shape, BEAM_EXCLUDE) > 0] = 0
    m[poly_mask(rgb.shape, STRIP_EXCLUDE) > 0] = 0
    # 手の下にかかる畳縁の白い欠片 (彩度が低く明るい画素) を除く。手の肌は彩度があるので残る
    whitish = (rgb.max(axis=2).astype(int) - rgb.min(axis=2).astype(int) < 28) & (rgb.astype(int).sum(axis=2) / 3 > 185)
    wedge = poly_mask(rgb.shape, WEDGE_OCHRE) > 0
    m[wedge & (r > g + 5) & (g > b + 20) & (lum > 120) & (lum < 172)] = 0    # 肌 (lum 190 前後) は残す
    # 肩の板の上に付いた鬼の牙 (白) と唇 (黄土) の欠片: 板の赤・暗色以外を除く
    lip = np.zeros(m.shape, bool)
    lip[346:366, 240:282] = True
    m[lip & ~((r > g + 45) | (lum < 90))] = 0
    hand_box = np.zeros(m.shape, bool)
    hand_box[534:580, 503:558] = True
    m[hand_box & whitish] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, K(1))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, K(1))
    # 内部の穴を埋める
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros_like(m)
    cv2.drawContours(filled, cs, -1, 1, -1)
    # 袖の下と裾の上のあいだは背景 (黄土色に草の筆線)。各列で、袖の青が終わる位置から
    # 裾の赤が始まる位置までを外す (袖と裾の輪郭線は残す)。柄がある x<203 は対象外
    blue = (b >= g - 10) & (b > r + 20)
    red = r > g + 55
    for x in range(203, 242):
        col_blue = np.where(blue[440:462, x])[0]
        col_red = np.where(red[456:486, x])[0]
        if len(col_blue) and len(col_red):
            y_top = 440 + col_blue.max() + 3
            y_bot = 456 + col_red.min() - 1
            if y_bot > y_top:
                filled[y_top:y_bot, x] = 0
    return peel_background(rgb, filled)


def peel_background(rgb, mask, thresh=22, max_iter=16):
    """マスクの縁に混ざった背景 (畳の緑・黄土色) を外側から 1px ずつ剥がす。
    周囲から補間した「人物が無い場合の地」との色差が小さい縁の画素だけを外す。
    人物の線・彩色は地との色差が大きいので残る。"""
    est = build_clean_plate(rgb, mask, add_noise=False, grow=1).astype(np.int16)
    diff = np.abs(rgb.astype(np.int16) - est).max(axis=2)
    cross = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
    m = mask.copy()
    blade_zone = cv2.dilate(poly_mask(rgb.shape, SWORD), K(8)) > 0
    blade_zone[BLADE_ZONE_Y1:] = False
    # 刀身のほか、背景と色が近い細い部位 (短刀の柄、手、鍔と握り、鎧の裾) は剥がさない
    for poly in PEEL_PROTECT:
        blade_zone |= cv2.dilate(poly_mask(rgb.shape, poly), K(3)) > 0
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
def build_clean_plate(rgb, mask, add_noise=True, grow=2):
    """人物を除去した背景。周囲の色を Telea 法で回して埋める。
    パッチコピー系の手法は鬼の顔などを複製してしまうため使わない。"""
    hole = cv2.dilate(mask, K(grow))
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
FOREARM_POLY = [(468, 504), (484, 501), (498, 509), (507, 519), (514, 528), (524, 518), (538, 517), (552, 524),
                (556, 532), (554, 548), (548, 567), (526, 574), (504, 572), (488, 570), (484, 556), (492, 547),
                (484, 538), (474, 522)]
# 刀 = 刀身+鍔 (y<400, x<175) + 握っている手 + 手の下に出ている柄。握りを中心に一体で回す
SWORD_TOP_REGION = (410, 172)   # y<410 かつ x<172 (鍔の下端まで含める)
HAND_POLY = [(128, 402), (150, 399), (165, 400), (172, 412), (172, 425), (166, 433), (150, 438), (138, 436),
             (130, 428), (126, 412)]
SWORD_TAIL_POLY = [(159, 428), (170, 428), (174, 436), (181, 445), (194, 458), (200, 472), (184, 472), (175, 456),
                   (165, 439), (159, 432)]
CLOTH_SKIRT = [(190, 520), (430, 520), (430, 640), (190, 640)]
CLOTH_SLEEVE = [(168, 395), (236, 395), (236, 458), (168, 458)]

# 関節付近 (中心, 半径) は土台に元の画素を残し、回した部位の下で継ぎ目が透けないようにする
KEEP_JOINTS = [(478, 500, 22), (172, 420, 14)]   # 肘 / 握りと袖

FOOT = (95.0, 655.0)     # 足元の基準点 (胴体の傾きの回転中心 = 全フレーム固定)
ELBOW = (478.0, 500.0)   # 右前腕の回転中心
GRIP = (152.0, 418.0)    # 刀の回転中心 (握り)
HEAD_C = (410.0, 410.0)

# フレームごとのパラメータ: 傾き(度,時計回り+) / 裾の揺れ(px) / 右前腕(度) / 刀(度) / 表示時間(ms)
FRAMES = [
    dict(lean=0.0, sway=0.0, fore=0.0, sword=0.0, ms=120),     # 01 元の構え
    dict(lean=0.5, sway=0.6, fore=-1.2, sword=-1.0, ms=100),   # 02 ごくわずかに重心が動く
    dict(lean=0.8, sway=1.2, fore=-3.5, sword=-2.5, ms=100),   # 03 上半身・腕の微細な変化
    dict(lean=0.85, sway=1.6, fore=-2.5, sword=-4.5, ms=80),   # 04 刀が少し動く (振りかぶり)。身体は 03 から戻さず沈み込みを続ける
    dict(lean=1.1, sway=2.4, fore=2.5, sword=7.0, ms=60),      # 05 刀の動きが最も大きい (1 コマで跳びすぎないよう 7°)
    dict(lean=1.3, sway=-1.5, fore=4.5, sword=15.0, ms=180),   # 06 振り切った状態を少し保持
    dict(lean=0.6, sway=-0.8, fore=1.5, sword=5.0, ms=120),    # 07 元へ戻る
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
        sword_top = (yy < SWORD_TOP_REGION[0] - CY0) & (xx < SWORD_TOP_REGION[1] - CX0) & m
        sword_tail = (poly_mask(shp, to_canvas(SWORD_TAIL_POLY)) > 0) & m
        sword_hand = (poly_mask(shp, to_canvas(HAND_POLY)) > 0) & m
        forearm = (poly_mask(shp, to_canvas(FOREARM_POLY)) > 0) & m
        col = self.P[..., :3] / np.maximum(self.P[..., 3:4], 1e-4)
        cr, cg, cb = col[..., 0], col[..., 1], col[..., 2]
        pale_green = (cg > cr + 12) & (cg >= cb - 5) & ((cr + cg + cb) / 3 > 140)
        forearm &= ~pale_green                      # 袖の薄緑は回さず土台に残す
        self.parts = {
            "sword": sword_top | sword_tail | sword_hand,
            "fore": forearm,
        }
        cut = self.parts["sword"] | self.parts["fore"]
        # 関節付近 (中心, 半径) は土台に残す。回した部位の下で継ぎ目が透けるのを防ぐ
        for cx, cy, r in keep_joints:
            cut &= ((xx - (cx - CX0)) ** 2 + (yy - (cy - CY0)) ** 2) > r * r
        self.base = self.P * (~cut)[..., None]
        self._fill_under_pommel(cut)
        # 布の揺れ・頭の補正用の重み
        def soft(pts, s):
            return cv2.GaussianBlur(poly_mask(shp, to_canvas(pts)).astype(np.float32), (0, 0), s)
        ramp = np.clip((yy + CY0 - 535.0) / 100.0, 0, 1) ** 2
        self.w_skirt = soft(CLOTH_SKIRT, 5) * ramp
        self.w_sleeve = soft(CLOTH_SLEEVE, 4) * 0.6
        self.w_head = soft(HEAD_POLY, 8)

    def _fill_under_pommel(self, cut):
        """柄の端 (石突き) は裾の赤の上にあった。柄を動かすと、そこが抜けて透けるので、周りの赤で埋める。
        埋めるのは、補間の結果が赤い画素だけ (裾の上より上の背景まで赤くしない)。"""
        x0, x1 = 170 - CX0, 216 - CX0
        y0, y1 = 452 - CY0, 490 - CY0
        yy = np.arange(y0, y1)[:, None] + CY0
        vac = self.parts["sword"][y0:y1, x0:x1] & (yy >= 467)
        if not vac.any():
            return
        a = self.base[y0:y1, x0:x1, 3]
        col = (self.base[y0:y1, x0:x1, :3] / np.maximum(a[..., None], 1e-4)).clip(0, 255).astype(np.uint8)
        unknown = (vac | (a < 0.5)).astype(np.uint8)
        filled = cv2.inpaint(cv2.cvtColor(col, cv2.COLOR_RGB2BGR), unknown, 3, cv2.INPAINT_TELEA)
        rgb = cv2.cvtColor(filled, cv2.COLOR_BGR2RGB).astype(np.float32)
        reddish = (rgb[..., 0] > rgb[..., 1] + 45) & (rgb[..., 0] > 120)
        sel = vac & reddish
        self.base[y0:y1, x0:x1, :3][sel] = rgb[sel]
        self.base[y0:y1, x0:x1, 3][sel] = 1.0

    def render(self, lean, sway, fore, sword, interp=cv2.INTER_LANCZOS4):
        h, w = self.h, self.w
        F = canvas_pt(FOOT)
        M_lean = rot_about(lean, F)
        # --- 胴体・頭・衣服: 連続的な変形 (dst→src の逆写像)
        # 足元 (草鞋・足首) は動かさない: 足元から 45px までは 0、160px 以上で全量になるよう重みをかける
        dist = np.hypot(self.xx - F[0], self.yy - F[1])
        t = np.clip((dist - 45.0) / 115.0, 0.0, 1.0)
        w_lean = t * t * (3.0 - 2.0 * t)
        disp_x = M_lean[0, 0] * self.xx + M_lean[0, 1] * self.yy + M_lean[0, 2] - self.xx
        disp_y = M_lean[1, 0] * self.xx + M_lean[1, 1] * self.yy + M_lean[1, 2] - self.yy
        qx = self.xx - w_lean * disp_x
        qy = self.yy - w_lean * disp_y
        # 頭は胴体の動きの 70% を打ち消して「ほぼ固定」にする
        hc = np.array([*canvas_pt(HEAD_C), 1.0])
        d_head = -0.7 * (M_lean @ hc - hc[:2])
        dx = sway * (self.w_skirt + self.w_sleeve) + d_head[0] * self.w_head
        dy = d_head[1] * self.w_head + 0.4 * sway * self.w_sleeve
        sx = (qx - dx).astype(np.float32)
        sy = (qy - dy).astype(np.float32)
        base = cv2.remap(self.base, sx, sy, interp, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        base = fix_premult(base)
        out = base
        # --- 切り離した部位 (剛体として回転)。胴体の傾きも重ねる
        for name, angle, pivot in (("fore", fore, ELBOW), ("sword", sword, GRIP)):
            M = compose(rot_about(angle, canvas_pt(pivot)), M_lean)
            layer = cv2.warpAffine(self.P * self.parts[name][..., None], M, (w, h), flags=interp,
                                   borderMode=cv2.BORDER_CONSTANT, borderValue=0)
            layer = fix_premult(layer)
            out = layer + out * (1.0 - layer[..., 3:4])
        return finish_frame(out)


def fix_premult(p):
    """Lanczos/bicubic の行き過ぎ (アルファが範囲外、色がアルファを超える) を抑える。"""
    a = np.clip(p[..., 3:4], 0.0, 1.0)
    return np.concatenate([np.clip(p[..., :3], 0.0, 255.0 * a), a], axis=-1)


def finish_frame(p, min_area=25, sigma=0.6):
    """全フレームの縁を同じ作りにそろえる。
    - アルファを 2 値にして (動かしたフレームだけ半透明になるのを防ぐ)、孤立した小片を除く
    - 縁の色は内側の色を外へ延ばして使い、同じ幅 (sigma) だけぼかして柔らかくする
    これで、静止 (1・8) と動いたフレーム (2〜7) の縁が同じ見え方になる。"""
    a = p[..., 3]
    hard = (a > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(hard)
    for i in range(1, n):
        if st[i, 4] < min_area:
            hard[lab == i] = 0
    hf = hard.astype(np.float32)
    col = np.where(a[..., None] > 1e-4, p[..., :3] / np.maximum(a[..., None], 1e-4), 0.0) * hf[..., None]
    num = cv2.GaussianBlur(col * hf[..., None], (0, 0), 1.2)
    den = cv2.GaussianBlur(hf, (0, 0), 1.2)[..., None]
    ext = np.where(den > 1e-3, num / np.maximum(den, 1e-3), 0.0)
    col = np.where(hf[..., None] > 0, col, ext)
    alpha = cv2.GaussianBlur(hf, (0, 0), sigma)
    alpha[alpha < 0.04] = 0.0
    return np.concatenate([col * alpha[..., None], alpha[..., None]], axis=-1).astype(np.float32)


def premul_to_rgba8(p):
    a = p[..., 3:4]
    rgb = np.where(a > 1e-4, p[..., :3] / np.maximum(a, 1e-4), 0)
    out = np.clip(np.concatenate([rgb, a * 255.0], axis=-1) + 0.5, 0, 255).astype(np.uint8)
    out[out[..., 3] == 0, :3] = 0
    return out


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

    # スプライトのマスクは太らせない (人物A と同じ)。縁の明るい画素は背景プレート側で埋める
    plate = build_clean_plate(rgb, mask)
    Image.fromarray(plate).save(OUT_BG)

    # 切り抜き: 元ピクセルをそのまま保持 (再彩色・ぼかしなし)。マスク内 alpha=1、外 0。
    # 動かすときの縁は warp の補間で自然にアンチエイリアスされる。
    alpha = mask.astype(np.float32)
    rgba = np.dstack([rgb.astype(np.float32), alpha * 255.0])
    sprite_full = rgba[CY0:CY1, CX0:CX1]
    P = np.dstack([sprite_full[..., :3] * (sprite_full[..., 3:4] / 255.0), sprite_full[..., 3:4] / 255.0]).astype(np.float32)
    # samurai_01 用に元の切り抜きも保持
    rig = Rig(P, mask[CY0:CY1, CX0:CX1], keep_joints=KEEP_JOINTS)

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
