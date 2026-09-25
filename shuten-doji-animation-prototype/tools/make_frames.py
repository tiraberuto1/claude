"""samurai_01.png（元絵の画素）を部位ごとに変形して 8 フレームを作る。

描き直しは行わず、画素の移動だけで動かす。
  刀の層（刀身・鍔・左手・柄）: 剛体変換。手を支点に回転 + 肩を支点に腕の弧 + 胴の前傾
  胴体の層                    : 制御点による MLS 剛体変形（頭・足元は固定）
フレーム 01 と 08 は無変形で、元絵と画素単位で一致する。
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
CHAR_DIR = ROOT / "assets/characters/samurai_left_bottom"
BASE = CHAR_DIR / "samurai_01.png"
CANVAS = json.loads((CHAR_DIR / "frame_canvas.json").read_text())
OX, OY = CANVAS["canvas_origin_in_scroll"]

# 以下の座標はすべて元絵巻上の座標
BLADE = [(32, 172), (36, 200), (46, 225), (57, 250), (71, 275), (85, 300),
         (98, 325), (108, 350), (118, 370), (125, 385)]
HAND_GRIP = [(105, 378), (135, 372), (160, 396), (166, 418), (197, 455),
             (200, 470), (186, 476), (150, 442), (126, 428), (108, 402)]
GRIP = (140.0, 405.0)        # 柄を握る手（刀の回転の支点）
SHOULDER = (238.0, 418.0)    # 左肩（腕の弧の支点）

# 制御点: (x, y, 胴の前傾に追従する割合, 部位)
CONTROLS = [
    # 頭（鬼が噛みついているので固定）
    (400, 410, 0.0, "head"), (365, 398, 0.0, "head"), (435, 395, 0.0, "head"),
    (395, 445, 0.0, "head"), (355, 432, 0.0, "head"), (445, 430, 0.0, "head"),
    # 足元・膝（接地点は固定）
    (45, 615, 0.0, "foot"), (90, 652, 0.0, "foot"), (225, 635, 0.0, "foot"),
    (360, 630, 0.0, "foot"), (415, 605, 0.0, "foot"), (150, 575, 0.0, "foot"),
    (120, 520, 0.1, "leg"), (390, 585, 0.1, "leg"),
    # 左袖の上端（鬼の歯の下）
    (230, 360, 0.3, "sode"), (300, 355, 0.2, "sode"), (335, 360, 0.1, "sode"),
    # 胴
    (300, 480, 1.0, "torso"), (345, 470, 0.8, "torso"), (270, 520, 0.9, "torso"),
    (360, 520, 0.8, "torso"), (250, 440, 0.9, "torso"),
    # 腰・草摺
    (220, 560, 0.5, "skirt"), (300, 585, 0.45, "skirt"), (360, 555, 0.5, "skirt"),
    (95, 438, 0.5, "scabbard"), (145, 472, 0.5, "scabbard"),
    (430, 545, 0.5, "tanto"),
    # 左腕（手に追従）
    (205, 425, 0.7, "sleeve"), (185, 440, 0.7, "sleeve"), (168, 418, 1.0, "cuff"),
    # 右腕
    (455, 445, 0.6, "rarm"), (490, 520, 0.4, "rarm"), (527, 550, 0.3, "rhand"),
]

# フレームごとの動き: 胴の前傾(dx,dy), 刀の回転(度, +で前へ振る), 腕の弧(度, +で前へ), 布の揺れ
FRAMES = [
    dict(lean=(0.0, 0.0), sword=0.0, arm=0.0, sway=0.0),    # 01 元の構え
    dict(lean=(1.5, 0.5), sword=-1.5, arm=0.0, sway=0.3),   # 02 わずかに前傾
    dict(lean=(2.0, 1.0), sword=-3.0, arm=-1.5, sway=0.6),  # 03 上半身・腕を少し動かす
    dict(lean=(1.5, 0.5), sword=-5.0, arm=-3.0, sway=0.4),  # 04 刀を少し上げる
    dict(lean=(3.0, 1.0), sword=8.0, arm=3.0, sway=-0.6),   # 05 刀を振る
    dict(lean=(4.0, 1.5), sword=14.0, arm=5.0, sway=-1.0),  # 06 振り切る
    dict(lean=(2.0, 1.0), sword=5.0, arm=2.0, sway=-0.4),   # 07 元の姿勢へ戻る
    dict(lean=(0.0, 0.0), sword=0.0, arm=0.0, sway=0.0),    # 08 元の構え
]
SWAY_PARTS = {"skirt": (0.0, 1.0), "sleeve": (0.6, 0.8)}   # 揺れの向き


def to_canvas(pts):
    return np.array([(x - OX, y - OY) for x, y in pts], np.float32)


def rot(theta_deg, center):
    """画面上で時計回り（+）の回転を表す 2x3 行列。"""
    return cv2.getRotationMatrix2D(center, -theta_deg, 1.0)


def compose(a, b):
    """a ∘ b（b を先に適用）。"""
    A = np.vstack([a, [0, 0, 1]])
    B = np.vstack([b, [0, 0, 1]])
    return (A @ B)[:2]


def sword_transform(f):
    grip = tuple(to_canvas([GRIP])[0])
    shoulder = tuple(to_canvas([SHOULDER])[0])
    m = compose(rot(f["arm"], shoulder), rot(f["sword"], grip))
    m[:, 2] += f["lean"]
    return m


def split_layers(base):
    alpha = base[..., 3] > 0
    m = np.zeros(alpha.shape, np.uint8)
    cv2.polylines(m, [to_canvas(BLADE).astype(np.int32)], False, 255, 24)
    cv2.fillPoly(m, [to_canvas(HAND_GRIP).astype(np.int32)], 255)
    m = cv2.dilate(m, np.ones((9, 9), np.uint8))
    region = (m > 0) & alpha
    # 輪郭のにじみの輪（元の背景色）は刀と一緒に動かさない
    core = cv2.erode(alpha.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))) > 0
    sword = region & core

    body = base.copy()
    body[region] = 0
    # 柄の下に隠れていた胴体（袖・草摺）の縁だけを周囲から延ばす。静止時は刀の層が覆うので見えない
    grown = cv2.dilate((alpha & ~region).astype(np.uint8), np.ones((7, 7), np.uint8))
    under = region & (grown > 0)
    rgb = cv2.inpaint(body[..., :3], under.astype(np.uint8), 3, cv2.INPAINT_TELEA)
    body[under, :3] = rgb[under]
    body[under, 3] = 255

    # にじみの輪は動かすと背景の模様と食い違うので、外側ほど薄くして馴染ませる
    dist = cv2.distanceTransform(body[..., 3].copy(), cv2.DIST_L2, 3)
    ring = (body[..., 3] > 0) & (dist < 3)
    body[ring, 3] = np.clip(dist[ring] / 3 * 255, 60, 255).astype(np.uint8)

    sw = np.zeros_like(base)
    sw[sword] = base[sword]
    return body, sw


def mls_rigid_inverse(shape, src_pts, dst_pts, alpha=1.0):
    """出力画素 → 入力画素 の写像を MLS 剛体変形で求める（dst→src を補間）。"""
    h, w = shape
    vy, vx = np.mgrid[0:h, 0:w].astype(np.float32)
    v = np.stack([vx.ravel(), vy.ravel()], 1)
    p, q = dst_pts, src_pts
    d2 = ((v[:, None, :] - p[None]) ** 2).sum(2)
    wgt = 1.0 / np.maximum(d2, 1e-6) ** alpha
    wsum = wgt.sum(1, keepdims=True)
    pstar = (wgt @ p) / wsum
    qstar = (wgt @ q) / wsum
    ph = p[None] - pstar[:, None]
    qh = q[None] - qstar[:, None]
    vp = v - pstar
    # 剛体 MLS（Schaefer et al. 2006）
    perp = lambda a: np.stack([-a[..., 1], a[..., 0]], -1)
    a1 = (wgt[..., None] * qh * ph).sum(1).sum(1)
    a2 = (wgt[..., None] * qh * perp(ph)).sum(1).sum(1)
    mu = np.sqrt(a1 ** 2 + a2 ** 2) + 1e-9
    c, s = a1 / mu, a2 / mu
    # 回転 R: (x, y) -> (c x - s y, s x + c y)
    fx = c * vp[:, 0] - s * vp[:, 1]
    fy = s * vp[:, 0] + c * vp[:, 1]
    out = np.stack([fx, fy], 1) + qstar
    exact = d2.min(1) < 1e-6
    out[exact] = q[d2[exact].argmin(1)]
    return out[:, 0].reshape(h, w), out[:, 1].reshape(h, w)


def control_targets(f, sword_m):
    src, dst = [], []
    grip_move = cv2.transform(to_canvas([GRIP])[None], sword_m)[0, 0] - to_canvas([GRIP])[0]
    for x, y, k, part in CONTROLS:
        p = to_canvas([(x, y)])[0]
        d = np.array(f["lean"], np.float32) * k
        if part == "sleeve":
            d = d * 0.4 + grip_move * 0.6
        if part == "cuff":
            d = grip_move.copy()
        if part in SWAY_PARTS:
            d = d + np.array(SWAY_PARTS[part], np.float32) * f["sway"]
        src.append(p)
        dst.append(p + d)
    # 手首は刀の層と一致させる
    g = to_canvas([GRIP])[0]
    src.append(g)
    dst.append(g + grip_move)
    return np.array(src, np.float32), np.array(dst, np.float32)


def render(base, body, sword, f):
    if f["lean"] == (0.0, 0.0) and f["sword"] == 0.0 and f["arm"] == 0.0 and f["sway"] == 0.0:
        return base.copy()
    h, w = base.shape[:2]
    sm = sword_transform(f)
    src, dst = control_targets(f, sm)
    mx, my = mls_rigid_inverse((h, w), src, dst)
    warped = cv2.remap(body, mx.astype(np.float32), my.astype(np.float32),
                       cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    sw = cv2.warpAffine(sword, sm, (w, h), flags=cv2.INTER_LINEAR,
                        borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return over(sw, warped)


def over(top, bottom):
    """事前乗算なしの RGBA 合成。"""
    ta = top[..., 3:].astype(np.float32) / 255
    ba = bottom[..., 3:].astype(np.float32) / 255
    oa = ta + ba * (1 - ta)
    rgb = (top[..., :3] * ta + bottom[..., :3] * ba * (1 - ta)) / np.maximum(oa, 1e-6)
    out = np.zeros_like(top)
    out[..., :3] = np.clip(np.round(rgb), 0, 255).astype(np.uint8)
    out[..., 3] = np.clip(np.round(oa[..., 0] * 255), 0, 255).astype(np.uint8)
    return out


def main():
    base = cv2.imread(str(BASE), cv2.IMREAD_UNCHANGED)
    body, sword = split_layers(base)
    for i, f in enumerate(FRAMES, 1):
        frame = render(base, body, sword, f)
        cv2.imwrite(str(CHAR_DIR / f"samurai_{i:02d}.png"), frame)
        print(f"samurai_{i:02d}.png", f)


if __name__ == "__main__":
    main()
