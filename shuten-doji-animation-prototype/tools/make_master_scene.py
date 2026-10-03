#!/usr/bin/env python3
"""MASTER SCENE 用の素材を作る (人物は元絵巻の切り抜きだけを使い、AI で描き直さない)。

出力:
  assets/characters/samurai_left_bottom/idle/idle_01〜07.png   待機モーション (580x580、絵巻の座標 (0,120) 始点)
  assets/characters/samurai_left_bottom/character.json         身長・接地点・中心・軸・当たり判定・部位の情報
  assets/effects/brush_slash/slash_a〜c.png                    刀の軌跡の筆線 (墨と朱、かすれあり)
  assets/effects/brush_slash/effect.json                       エフェクトの置き場所とタイミング

前提: python3 tools/make_assets.py を先に実行して tools/mask_samurai.png を作っておく。
再生成: python3 tools/make_master_scene.py
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_assets as MA  # noqa: E402

ROOT = MA.ROOT
CHAR = os.path.join(ROOT, "assets/characters/samurai_left_bottom")
FX = os.path.join(ROOT, "assets/effects/brush_slash")

# ---------------------------------------------------------------- 待機モーション
# 動きの目安 (元絵 px): 頭 ±1〜3 / 身体 ±1〜2 / 腕 ±2〜5 / 衣服 ±1〜4 / 武器 ±2〜6。足元は動かさない。
# lean=身体の傾き(度) sway=裾・袖の揺れ(px) fore=右前腕(度) sword=刀と握る手(度) head=頭だけの動き(px)
IDLE = [
    dict(lean=0.00, sway=0.0, fore=0.0, sword=0.0, head=(0.0, 0.0), ms=500),
    dict(lean=0.20, sway=1.0, fore=-1.0, sword=-0.5, head=(0.4, -0.8), ms=350),
    dict(lean=0.35, sway=2.2, fore=-2.0, sword=-1.0, head=(0.8, -1.6), ms=350),
    dict(lean=0.20, sway=1.2, fore=-1.0, sword=-0.4, head=(0.4, -0.8), ms=350),
    dict(lean=0.00, sway=-0.8, fore=1.0, sword=0.6, head=(-0.4, 0.0), ms=350),
    dict(lean=-0.15, sway=-1.6, fore=1.5, sword=1.0, head=(-0.8, 0.6), ms=350),
    dict(lean=-0.05, sway=-0.6, fore=0.5, sword=0.3, head=(-0.3, 0.2), ms=350),
]

# ---------------------------------------------------------------- 筆線エフェクト
GRIP = (152.0, 418.0)          # 刀の握り (回転の中心)
TIP0 = (32.0, 169.0)           # 刀の切先 (元の構え)
FX_BOX = (0, 100, 300, 330)    # エフェクトのキャンバス (x0, y0, x1, y1) 元絵巻の座標
INK = (30, 25, 22)
VERMILION = (182, 50, 38)


def arc_path(radius_scale, a0, a1, n=400):
    """握りを中心に、切先 (の radius_scale 倍) が a0〜a1 度 (時計回り +) 回る弧。"""
    v = np.array([TIP0[0] - GRIP[0], TIP0[1] - GRIP[1]]) * radius_scale
    th = np.deg2rad(np.linspace(a0, a1, n))
    x = v[0] * np.cos(th) - v[1] * np.sin(th) + GRIP[0]
    y = v[0] * np.sin(th) + v[1] * np.cos(th) + GRIP[1]
    return np.stack([x, y], axis=1)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def brush_stroke(path, wmax, color, frac, opacity, seed, size, ss=3):
    """可変幅・かすれのある筆線。path は元絵巻の座標。size=(w,h)、FX_BOX の原点で描く。"""
    rng = np.random.default_rng(seed)
    W, H = size
    seg = np.diff(path, axis=0)
    ds = np.hypot(seg[:, 0], seg[:, 1])
    s = np.concatenate([[0], np.cumsum(ds)])
    total = s[-1]
    sn_all = s / total
    tang = np.gradient(path, axis=0)
    tang /= np.maximum(np.hypot(tang[:, 0], tang[:, 1])[:, None], 1e-6)
    nrm = np.stack([-tang[:, 1], tang[:, 0]], axis=1)

    step = 0.4
    ns = int(total * frac / step)
    sn = np.linspace(0, frac, ns)
    px = np.interp(sn, sn_all, path[:, 0]); py = np.interp(sn, sn_all, path[:, 1])
    nx = np.interp(sn, sn_all, nrm[:, 0]); ny = np.interp(sn, sn_all, nrm[:, 1])
    # 筆圧: 入りは細く、中ほどで太く、抜けは細い。幅は少し揺らす
    prof = np.sin(np.pi * np.clip(sn / max(frac, 1e-6) * 0.92 + 0.04, 0, 1)) ** 0.7
    wob = 1 + 0.12 * np.convolve(rng.normal(size=ns), np.ones(40) / 40, mode="same") * 6
    w = np.maximum(wmax * prof * wob, 0.9)
    dry = smoothstep(0.45, 1.0, sn)              # 終わりに向かってかすれる
    nu = int(wmax * 2 / 0.4) + 1
    fiber = rng.random(nu)                       # 毛先ごとの墨の乗り
    slow = rng.random((int(ns / 14) + 2, nu))    # 場所ごとのむら
    acc = np.zeros((H * ss, W * ss), np.float32)
    for k in range(ns):
        wk = w[k]
        us = np.arange(-wk, wk + 1e-6, 0.4)
        iu = np.clip(((us + wmax) / 0.4).astype(int), 0, nu - 1)
        streak = 0.65 * fiber[iu] + 0.35 * slow[k // 14, iu]
        edge = 1 - (np.abs(us) / wk) ** 2.5
        raw = edge + 0.55 * (streak - 0.5) - 1.1 * dry[k] * (1 - streak)
        a = smoothstep(0.12, 0.42, raw)
        xs = ((px[k] + us * nx[k] - FX_BOX[0]) * ss).round().astype(int)
        ys = ((py[k] + us * ny[k] - FX_BOX[1]) * ss).round().astype(int)
        ok = (xs >= 0) & (xs < W * ss) & (ys >= 0) & (ys < H * ss)
        np.maximum.at(acc, (ys[ok], xs[ok]), a[ok].astype(np.float32))
    acc = cv2.morphologyEx(acc, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ss + 1, ss + 1)))
    alpha = cv2.resize(acc, (W, H), interpolation=cv2.INTER_AREA) * opacity
    return np.clip(alpha, 0, 1)


def build_effects():
    os.makedirs(FX, exist_ok=True)
    W, H = FX_BOX[2] - FX_BOX[0], FX_BOX[3] - FX_BOX[1]
    ink_path = arc_path(1.00, -8, 21)       # 切先がたどる弧
    ver_path = arc_path(0.72, -4, 19)       # 刀の中ほどがたどる弧
    sets = {"slash_a": (0.55, 1.0), "slash_b": (1.0, 1.0), "slash_c": (1.0, 0.45)}   # (描き進み, 濃さ)
    for name, (frac, op) in sets.items():
        ink = brush_stroke(ink_path, 7.0, INK, frac, 0.92 * op, 11, (W, H))
        ver = brush_stroke(ver_path, 3.2, VERMILION, frac, 0.85 * op, 23, (W, H))
        # 墨の上に朱を重ねる (乗算の見た目になるよう、色を掛け合わせてから 1 枚にする)
        a = 1 - (1 - ink) * (1 - ver)
        col = np.zeros((H, W, 3), np.float32)
        w_ink = ink / np.maximum(ink + ver, 1e-6)
        col[:] = np.array(INK) * w_ink[..., None] + np.array(VERMILION) * (1 - w_ink)[..., None]
        rgba = np.dstack([col, a * 255]).clip(0, 255).astype(np.uint8)
        Image.fromarray(rgba, "RGBA").save(os.path.join(FX, name + ".png"))
    json.dump({
        "origin": [FX_BOX[0], FX_BOX[1]],
        "size": [W, H],
        "blend": "multiply",
        "note": "紙に墨が染みた見た目にするため、光らせず乗算で重ねる",
        "timeline": [
            {"frame": 5, "image": "slash_a.png"},
            {"frame": 6, "image": "slash_b.png"},
            {"frame": 7, "image": "slash_c.png"},
        ],
    }, open(os.path.join(FX, "effect.json"), "w"), ensure_ascii=False, indent=2)


# ---------------------------------------------------------------- キャラクター情報
def build_character_json(mask):
    ys, xs = np.where(mask > 0)
    sword_zone = np.zeros(mask.shape, bool)
    sword_zone[:MA.SWORD_TOP_REGION[0], :MA.SWORD_TOP_REGION[1]] = True
    body = (mask > 0) & ~sword_zone
    by, bx = np.where(body)
    low = ys >= ys.max() - 2
    foot = [round(float(xs[low].mean() + 0.5), 1), int(ys.max()) + 1]
    info = {
        "id": "samurai_left_bottom",
        "source": "scroll_original.png の左下の武者 (元ピクセルを切り抜き。再生成・再彩色なし)",
        "units": "元絵巻のピクセル座標 (scroll_original.png 2048x914)",
        "sprite_canvas": {"x": MA.CX0, "y": MA.CY0, "w": MA.CW, "h": MA.CH},
        "game_height": int(ys.max() + 1 - ys.min()),
        "game_height_note": "刀を含む高さ。刀を除く身体の高さは body_height",
        "body_height": int(by.max() + 1 - by.min()),
        "foot_position": foot,
        "center_x": round(float((bx.min() + bx.max() + 1) / 2), 1),
        "pivot": foot,
        "collision_box": {"x": int(bx.min()), "y": int(by.min()), "w": int(bx.max() + 1 - bx.min()), "h": int(by.max() + 1 - by.min()),
                          "note": "刀を除く身体の外接矩形。仮の値で、戦闘を作るときに詰める"},
        "game_canvas": {"size": 384, "ground": [90, 352], "scale": round(384 / 737, 5), "height": 256},
        "parts": {
            "head": {"pivot": [410, 410], "motion_px": "±1〜3"},
            "body": {"pivot": [MA.FOOT[0], MA.FOOT[1]], "motion_px": "±1〜2 (足元ほど小さく、足元は 0)"},
            "arm_right": {"pivot": list(MA.ELBOW), "motion_px": "±2〜5"},
            "weapon": {"pivot": list(MA.GRIP), "motion_px": "±2〜6 (待機) / 最大 約 77 (攻撃)"},
            "cloth": {"regions": ["裾", "左袖"], "motion_px": "±1〜4"},
            "leg": {"note": "足元は固定。この姿勢では歩行用の脚の分離はできない"},
            "hair": {"note": "兜をかぶっていて髪は見えない。分離しない"},
        },
    }
    json.dump(info, open(os.path.join(CHAR, "character.json"), "w"), ensure_ascii=False, indent=2)
    return info


def main():
    os.makedirs(os.path.join(CHAR, "idle"), exist_ok=True)
    rgb = np.array(Image.open(MA.SRC).convert("RGB"))
    mask = (np.array(Image.open(MA.OUT_MASK)) > 0).astype(np.uint8)
    sub_rgb = rgb[MA.CY0:MA.CY1, MA.CX0:MA.CX1].astype(np.float32)
    sub_a = mask[MA.CY0:MA.CY1, MA.CX0:MA.CX1].astype(np.float32)[..., None]
    P = np.concatenate([sub_rgb * sub_a, sub_a], axis=-1)
    rig = MA.Rig(P, mask[MA.CY0:MA.CY1, MA.CX0:MA.CX1], keep_joints=MA.KEEP_JOINTS)
    for i, prm in enumerate(IDLE, 1):
        p = rig.render(prm["lean"], prm["sway"], prm["fore"], prm["sword"], head=prm["head"])
        Image.fromarray(MA.premul_to_rgba8(p), "RGBA").save(os.path.join(CHAR, "idle", f"idle_{i:02d}.png"))
    json.dump({"durations_ms": [p["ms"] for p in IDLE], "loop": True},
              open(os.path.join(CHAR, "idle", "idle.json"), "w"), ensure_ascii=False, indent=2)
    build_effects()
    info = build_character_json(mask)
    print("character.json:", json.dumps({k: info[k] for k in ("game_height", "body_height", "foot_position", "center_x", "collision_box")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
