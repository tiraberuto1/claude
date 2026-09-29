"""ゲーム用 384x384 キャンバスへの変換。人物Aの静止画と 8 フレームで共通に使う。

make_assets.py のスプライトキャンバス (580x580、元絵座標 (0,120) 始点) を、
元絵座標の 737x737 の窓に置いて 384x384 へ縮める (倍率 384/737 = 0.5210)。
窓の位置は、足元 (草鞋の底、元絵の約 (96, 659)) がキャンバスの (90, 352) に来るように決めてある。
人物の高さ 491px (刀を含む) は約 256px になる。
"""
import cv2
import numpy as np

CANVAS = 384
WIN = 737
WIN_X0, WIN_Y0 = -78, -17          # 窓の左上 (元絵座標)
SPRITE_X0, SPRITE_Y0 = 0, 120      # make_assets.py のスプライトキャンバスの左上 (元絵座標)
GROUND = (90, 352)                 # 接地点 (ゲーム用キャンバス内)


def to_game_premul(P):
    """P: アルファ乗算済み float32 (580x580x4) -> 384x384x4 (アルファ乗算済み)。"""
    win = np.zeros((WIN, WIN, 4), np.float32)
    oy, ox = SPRITE_Y0 - WIN_Y0, SPRITE_X0 - WIN_X0
    h, w = P.shape[:2]
    win[oy:oy + h, ox:ox + w] = P
    return cv2.resize(win, (CANVAS, CANVAS), interpolation=cv2.INTER_AREA)


def to_game_rgba8(P):
    a = to_game_premul(P)
    al = a[..., 3:4]
    rgb = np.where(al > 1e-4, a[..., :3] / np.maximum(al, 1e-4), 0)
    out = np.clip(np.concatenate([rgb, al * 255.0], axis=-1) + 0.5, 0, 255).astype(np.uint8)
    out[out[..., 3] == 0, :3] = 0      # 完全透明の画素は RGB も 0
    return out
