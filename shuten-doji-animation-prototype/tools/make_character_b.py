#!/usr/bin/env python3
"""人物B (絵巻の中央下で右向きに走る、黄と赤の鎧の武者) の切り抜きと、待機・歩行のコマを作る。

人物A と同じ方針: 元絵のピクセルを切り抜いて部位ごとに少し動かす。AI での描き直し・再彩色はしない。
向きは元絵のまま (右向き)。左右反転は、表示側で掛ける。

出力:
  assets/characters/samurai_center_bottom/idle/idle_01〜07.png    待機 (キャンバスは SPRITE の範囲、元絵座標で置く)
  assets/characters/samurai_center_bottom/walk/walk_01〜08.png    歩行 (すねを小さく前後に振る)
  assets/characters/samurai_center_bottom/cutout.png              元の姿勢の切り抜き
  assets/characters/samurai_center_bottom/character.json          身長・接地点・中心・軸・当たり判定・部位
  assets/scroll/scroll_background_clean_ab.png                    人物A と人物B を除去した背景
  tools/mask_samurai_b.png                                        切り抜きマスク

前提: python3 tools/make_assets.py を先に実行する (人物A を除去した背景を土台に使う)。
再生成: python3 tools/make_character_b.py
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
OUT = os.path.join(ROOT, "assets/characters/samurai_center_bottom")
OUT_MASK = os.path.join(ROOT, "tools/mask_samurai_b.png")
OUT_BG = os.path.join(ROOT, "assets/scroll/scroll_background_clean_ab.png")
K = MA.K

# スプライトのキャンバス (元絵座標)
SX0, SY0, SX1, SY1 = 640, 440, 1080, 840
SW, SH = SX1 - SX0, SY1 - SY0

# 人物B の大まかな輪郭 (元絵座標、時計回り)。GrabCut で境界を詰める。
BODY = [(790, 588), (805, 570), (800, 540), (790, 520),
        (805, 518), (850, 520), (880, 512), (905, 514), (930, 516), (946, 508), (956, 494), (995, 488), (1012, 505),
        (1018, 530), (1028, 565), (1022, 582), (1000, 592), (988, 600), (978, 612), (985, 625), (1000, 640),
        (1002, 655), (988, 660), (980, 672), (990, 690), (980, 705), (965, 715), (962, 740), (958, 770), (950, 790),
        (985, 792), (1000, 800), (985, 815), (940, 818), (915, 815), (915, 790), (922, 760), (925, 735), (915, 722),
        (880, 722), (868, 728), (855, 745), (835, 752), (800, 758), (790, 745), (770, 745), (745, 752), (725, 762),
        (712, 765), (712, 790), (705, 802), (690, 802), (682, 785), (680, 760), (685, 745), (700, 740), (740, 730),
        (770, 718), (775, 705), (790, 695), (785, 680), (770, 668), (742, 668), (738, 655), (755, 650), (765, 640),
        (745, 622), (728, 612), (740, 605), (770, 597), (785, 594)]

# 部位 (元絵座標)
REAR_SHIN = [(676, 738), (716, 734), (748, 726), (776, 716), (790, 722), (790, 752), (766, 752), (740, 754), (718, 766),
             (716, 792), (706, 806), (688, 806), (678, 786)]          # 後ろ足: 膝から草鞋まで
REAR_KNEE = (782.0, 733.0)
FRONT_SHIN = [(912, 716), (962, 712), (964, 745), (958, 775), (952, 792), (990, 794), (1004, 802), (988, 820),
              (938, 822), (912, 818), (912, 790), (918, 760)]           # 前足: 膝から草鞋まで
FRONT_KNEE = (938.0, 718.0)
HEAD = [(940, 484), (998, 484), (1022, 508), (1030, 540), (1032, 572), (1022, 588), (990, 596), (965, 580), (940, 556)]
HEAD_C = (985.0, 540.0)
SCABBARD = [(680, 509), (690, 509), (707, 530), (740, 559), (772, 583), (782, 588), (768, 592), (732, 574), (697, 547), (678, 528)]
FOOT = (947.0, 821.0)      # 前の足 (草鞋の底) を接地点にする


def poly(shape, pts):
    return MA.poly_mask(shape, pts)


def build_mask(rgb):
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    m = MA.grabcut(bgr, BODY, 7, 10) | MA.grabcut(bgr, SCABBARD, 2, 6)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, K(2))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros_like(m)
    cv2.drawContours(filled, cs, -1, 1, -1)
    # 最大の連結成分だけを残す
    n, lab, st, _ = cv2.connectedComponentsWithStats(filled)
    if n > 1:
        filled = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
    return filled


def build_plate(rgb, mask):
    """人物B を除いた背景。人物A 除去済みの背景を土台に、穴を FSR で埋める (周囲の地の模様をたどる)。"""
    base = np.array(Image.open(MA.OUT_BG).convert("RGB"))
    hole = cv2.dilate(mask, K(3))
    x0, y0, x1, y1 = 600, 400, 1120, 880
    win = cv2.cvtColor(base[y0:y1, x0:x1], cv2.COLOR_RGB2BGR)
    h = hole[y0:y1, x0:x1]
    first = cv2.inpaint(win, h, 5, cv2.INPAINT_TELEA)
    out = np.zeros_like(win)
    cv2.xphoto.inpaint(first, ((1 - h) * 255).astype(np.uint8), out, cv2.xphoto.INPAINT_FSR_FAST)
    res = base.copy()
    sel = h > 0
    blk = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
    res[y0:y1, x0:x1][sel] = blk[sel]
    return res


# ---------------------------------------------------------------- 動かし方
def rot_about(deg, c):
    return MA.rot_about(deg, c)


class BRig:
    """人物B を部位ごとに少し動かす。足元 (前の草鞋) は動かさない。"""

    def __init__(self, P, m):
        self.P, self.h, self.w = P, P.shape[0], P.shape[1]
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        self.xx, self.yy = xx, yy
        shp = (self.h, self.w)
        cv_ = lambda pts: [(x - SX0, y - SY0) for x, y in pts]
        mm = m > 0
        rear = (poly(shp, cv_(REAR_SHIN)) > 0) & mm
        # 膝から付け根側は土台に残す (回しても継ぎ目が透けないように)
        for (kx, ky) in (REAR_KNEE,):
            rear &= ((xx - (kx - SX0)) ** 2 + (yy - (ky - SY0)) ** 2) > 14 ** 2
        self.rear = rear
        self.base = P * (~rear)[..., None]
        self.w_head = cv2.GaussianBlur(poly(shp, cv_(HEAD)).astype(np.float32), (0, 0), 7)
        ramp = np.clip((yy + SY0 - 600.0) / 90.0, 0, 1) ** 2          # 鎧の裾から下の布
        skirt = cv2.GaussianBlur(poly(shp, cv_([(715, 600), (900, 600), (900, 700), (715, 700)])).astype(np.float32), (0, 0), 6)
        self.w_cloth = skirt * ramp

    def render(self, lean=0.0, bob=0.0, sway=0.0, head=(0.0, 0.0), rear=0.0):
        fx, fy = FOOT[0] - SX0, FOOT[1] - SY0
        M = rot_about(lean, (fx, fy))
        dist = np.hypot(self.xx - fx, self.yy - fy)
        t = np.clip((dist - 50.0) / 140.0, 0.0, 1.0)
        wl = t * t * (3.0 - 2.0 * t)
        dx = M[0, 0] * self.xx + M[0, 1] * self.yy + M[0, 2] - self.xx
        dy = M[1, 0] * self.xx + M[1, 1] * self.yy + M[1, 2] - self.yy + bob
        qx = self.xx - wl * dx - sway * self.w_cloth - head[0] * self.w_head
        qy = self.yy - wl * dy - head[1] * self.w_head
        base = cv2.remap(self.base, qx.astype(np.float32), qy.astype(np.float32), cv2.INTER_LANCZOS4,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        out = MA.fix_premult(base)
        kx, ky = REAR_KNEE[0] - SX0, REAR_KNEE[1] - SY0
        Mr = MA.compose(rot_about(rear, (kx, ky)), M)
        Mr[1, 2] += bob
        layer = cv2.warpAffine(self.P * self.rear[..., None], Mr, (self.w, self.h), flags=cv2.INTER_LANCZOS4,
                               borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        layer = MA.fix_premult(layer)
        out = layer + out * (1.0 - layer[..., 3:4])
        return MA.finish_frame(out)


# 待機: 頭 ±1〜3 / 身体 ±1〜2 / 衣服 ±1〜4。足元は 0。 (lean 度, bob px, sway px, head px)
IDLE = [(0.0, 0.0, 0.0, (0.0, 0.0), 500), (0.20, -0.6, 1.0, (0.4, -0.8), 350), (0.35, -1.2, 2.0, (0.8, -1.6), 350),
        (0.20, -0.6, 1.2, (0.4, -0.8), 350), (0.0, 0.2, -0.8, (-0.4, 0.0), 350), (-0.15, 0.6, -1.6, (-0.8, 0.6), 350),
        (-0.05, 0.2, -0.6, (-0.3, 0.2), 350)]
# 歩行: 後ろ足のすねが膝を軸に前後に振れる。身体は 1 歩ごとに少し上下する。前の足は接地したまま
WALK_MS = 110
WALK = []
for k in range(8):
    ph = 2 * np.pi * k / 8
    WALK.append((0.25 * np.sin(ph), -1.4 * np.cos(2 * ph), -1.8 * np.sin(ph - 0.6), (0.5 * np.sin(ph), -0.9 * np.cos(2 * ph)), 5.5 * np.sin(ph)))


def main():
    os.makedirs(os.path.join(OUT, "idle"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "walk"), exist_ok=True)
    rgb = np.array(Image.open(MA.SRC).convert("RGB"))
    mask = build_mask(rgb)
    Image.fromarray(mask * 255).save(OUT_MASK)
    Image.fromarray(build_plate(rgb, mask)).save(OUT_BG)
    sub = rgb[SY0:SY1, SX0:SX1].astype(np.float32)
    a = mask[SY0:SY1, SX0:SX1].astype(np.float32)[..., None]
    P = np.concatenate([sub * a, a], axis=-1)
    rig = BRig(P, mask[SY0:SY1, SX0:SX1])
    save = lambda p, path: Image.fromarray(MA.premul_to_rgba8(p), "RGBA").save(path)
    save(rig.render(), os.path.join(OUT, "cutout.png"))
    for i, (lean, bob, sway, head, ms) in enumerate(IDLE, 1):
        save(rig.render(lean, bob, sway, head), os.path.join(OUT, "idle", f"idle_{i:02d}.png"))
    for i, (lean, bob, sway, head, rear) in enumerate(WALK, 1):
        save(rig.render(lean, bob, sway, head, rear), os.path.join(OUT, "walk", f"walk_{i:02d}.png"))
    json.dump({"idle_durations_ms": [x[4] for x in IDLE], "walk_duration_ms": WALK_MS},
              open(os.path.join(OUT, "timing.json"), "w"), ensure_ascii=False, indent=2)
    ys, xs = np.where(mask > 0)
    sword = np.zeros(mask.shape, bool); sword[:, :790] = True; sword[:600, :] &= True
    body = (mask > 0) & ~((np.arange(mask.shape[0])[:, None] < 600) & (np.arange(mask.shape[1])[None, :] < 800))
    by, bx = np.where(body)
    info = {
        "id": "samurai_center_bottom",
        "source": "scroll_original.png の中央下の武者 (右向きで走る。元ピクセルを切り抜き。再生成・再彩色なし)",
        "units": "元絵巻のピクセル座標 (scroll_original.png 2048x914)",
        "facing": "right (元絵のまま。ゲームの進行は右から左なので、使うときは左右反転を掛ける)",
        "sprite_canvas": {"x": SX0, "y": SY0, "w": SW, "h": SH},
        "game_height": int(ys.max() + 1 - ys.min()),
        "foot_position": [FOOT[0], FOOT[1]],
        "center_x": round(float((xs.min() + xs.max() + 1) / 2), 1),
        "pivot": [FOOT[0], FOOT[1]],
        "collision_box": {"x": int(bx.min()), "y": int(by.min()), "w": int(bx.max() + 1 - bx.min()), "h": int(by.max() + 1 - by.min()),
                          "note": "鞘を除く身体の外接矩形。仮の値"},
        "parts": {
            "head": {"pivot": list(HEAD_C), "motion_px": "±1〜3"},
            "body": {"pivot": list(FOOT), "motion_px": "±1〜2 (足元ほど小さく、足元は 0)"},
            "leg_rear": {"pivot": list(REAR_KNEE), "motion_px": "歩行で ±5.5° (足先は約 ±10px)"},
            "leg_front": {"note": "接地したまま動かさない (足元の基準)"},
            "cloth": {"regions": ["鎧の裾"], "motion_px": "±1〜4"},
            "hair": {"note": "髷は頭と一緒に動かす。分離しない"},
        },
    }
    json.dump(info, open(os.path.join(OUT, "character.json"), "w"), ensure_ascii=False, indent=2)
    print("mask bbox x", xs.min(), xs.max(), "y", ys.min(), ys.max(), "area", int(mask.sum()), " game_height", info["game_height"])


if __name__ == "__main__":
    main()
