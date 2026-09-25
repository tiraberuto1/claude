"""左下の武者（源頼光）を元絵巻から切り抜く。

手作業で定義した制約（tools/samurai_mask_config.json）を GrabCut に与え、
境界帯だけを色で判定させる。RGB は元画像の画素をそのまま使い、アルファのみ付与する。

出力:
  assets/characters/samurai_left_bottom/samurai_mask.png   全体座標の二値マスク（背景復元の穴と同一）
  assets/characters/samurai_left_bottom/samurai_01.png     フレーム用キャンバスに配置した RGBA
  assets/scroll/scroll_foreground_oni.png                  武者の手前にある鬼の歯・顎（全体座標 RGBA）
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/scroll/scroll_original.png"
CFG = ROOT / "tools/samurai_mask_config.json"
CHAR_DIR = ROOT / "assets/characters/samurai_left_bottom"
FG_OUT = ROOT / "assets/scroll/scroll_foreground_oni.png"

# 全フレーム共通のキャンバス（元絵巻上の位置）。刀の振り幅の余白を含む。
FRAME_X, FRAME_Y, FRAME_W, FRAME_H = 0, 100, 640, 600
GRABCUT_ROI = (0, 120, 620, 700)
MIN_COMPONENT_PX = 40
OCCLUDER_REACH = 10
EDGE_GROW = 2          # 輪郭のにじみも武者側に含める幅


def poly(pts):
    return np.array(pts, np.int32).reshape(-1, 1, 2)


def build_constraints(img, cfg):
    h, w = img.shape[:2]
    m = np.full((h, w), cv2.GC_BGD, np.uint8)
    cv2.fillPoly(m, [poly(p) for p in cfg["outer"]], cv2.GC_PR_BGD)
    for s in cfg.get("outer_lines", []):
        cv2.polylines(m, [poly(s["pts"])], False, cv2.GC_PR_BGD, s["w"])
    for p in cfg.get("bg_poly", []):
        cv2.fillPoly(m, [poly(p)], cv2.GC_BGD)
    for s in cfg.get("bg_lines", []):
        cv2.polylines(m, [poly(s["pts"])], False, cv2.GC_BGD, s["w"])

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hue, sat = hsv[..., 0].astype(int), hsv[..., 1].astype(int)
    for r in cfg.get("fg_color", []):
        pm = np.zeros((h, w), np.uint8)
        cv2.fillPoly(pm, [poly(r["poly"])], 1)
        red = ((hue <= r["hmax"]) | (hue >= r["hmin2"])) & (sat >= r["smin"])
        m[(pm > 0) & red] = cv2.GC_FGD
    for r in cfg.get("bg_color", []):
        pm = np.zeros((h, w), np.uint8)
        cv2.fillPoly(pm, [poly(r["poly"])], 1)
        col = (hue >= r["hmin"]) & (hue <= r["hmax"]) & (sat >= r["smin"])
        m[(pm > 0) & col] = cv2.GC_BGD

    for p in cfg.get("fg_poly", []):
        cv2.fillPoly(m, [poly(p)], cv2.GC_FGD)
    for s in cfg.get("fg_lines", []):
        cv2.polylines(m, [poly(s["pts"])], False, cv2.GC_FGD, s["w"])
    for p in cfg.get("bg_poly_late", []):
        cv2.fillPoly(m, [poly(p)], cv2.GC_BGD)
    return m


def segment(img, m, cfg):
    x0, y0, x1, y1 = GRABCUT_ROI
    cv2.setRNGSeed(0)
    sub = m[y0:y1, x0:x1].copy()
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img[y0:y1, x0:x1], sub, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
    fg = np.zeros(m.shape, np.uint8)
    fg[y0:y1, x0:x1] = np.isin(sub, [cv2.GC_FGD, cv2.GC_PR_FGD]) * 255

    # 確定ストロークにつながる成分だけ残し、孤立片を除く
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg)
    anchored = set(np.unique(lab[(m == cv2.GC_FGD) & (fg > 0)]))
    keep = [i for i in range(1, n) if i in anchored and st[i, cv2.CC_STAT_AREA] >= MIN_COMPONENT_PX]
    fg = np.isin(lab, keep).astype(np.uint8) * 255

    # 小さな穴を埋める
    n, lab, st, _ = cv2.connectedComponentsWithStats(255 - fg)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < cfg.get("hole_px", 60):
            fg[lab == i] = 255
    return fg


def main():
    rgba = cv2.imread(str(SRC), cv2.IMREAD_UNCHANGED)
    img = rgba[..., :3]
    cfg = json.loads(CFG.read_text())

    core = segment(img, build_constraints(img, cfg), cfg)

    om = np.zeros(core.shape, np.uint8)
    cv2.fillPoly(om, [poly(p) for p in cfg["occluder"]], 255)
    # 武者に接する範囲（鬼の歯・下唇）だけを手前に置く
    near = cv2.dilate(core, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * OCCLUDER_REACH + 1,) * 2))
    occ = (om > 0) & (core == 0) & (near > 0)

    # 武者の画像と背景復元の穴を同じ範囲にして、静止時に元絵と画素単位で一致させる
    grown = cv2.dilate(core, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * EDGE_GROW + 1,) * 2))
    cv2.fillPoly(grown, [poly(p) for p in cfg.get("extra_poly", [])], 255)
    fg = ((grown > 0) & ~occ).astype(np.uint8) * 255
    CHAR_DIR.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(CHAR_DIR / "samurai_mask.png"), fg)

    out = np.zeros_like(rgba)
    out[fg > 0, :3] = img[fg > 0]
    out[..., 3] = fg
    frame = out[FRAME_Y:FRAME_Y + FRAME_H, FRAME_X:FRAME_X + FRAME_W]
    cv2.imwrite(str(CHAR_DIR / "samurai_01.png"), frame)
    fgl = np.zeros_like(rgba)
    fgl[occ, :3] = img[occ]
    fgl[..., 3] = occ * 255
    cv2.imwrite(str(FG_OUT), fgl)

    (CHAR_DIR / "frame_canvas.json").write_text(json.dumps(
        {"source": "assets/scroll/scroll_original.png",
         "canvas_origin_in_scroll": [FRAME_X, FRAME_Y],
         "canvas_size": [FRAME_W, FRAME_H]}, ensure_ascii=False, indent=2) + "\n")
    print(f"samurai px={int((fg > 0).sum())} occluder px={int(occ.sum())}")


if __name__ == "__main__":
    main()
