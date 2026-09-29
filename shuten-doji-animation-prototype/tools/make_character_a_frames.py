#!/usr/bin/env python3
"""人物A の 8 フレーム微細アニメーション (ゲーム用 384x384、接地点 (91, 352) 固定)。

make_assets.py と同じ部位分けで、元の高さのままフレームを作ってから、
人物A の静止画と同じ処理 (game_canvas.py) で 384x384 へ縮める。
そのため 1 枚目は character_a.png と一致し、足元の基準点は全フレームで動かない。

前提: python3 tools/make_assets.py と python3 tools/make_character_a.py を先に実行する。
再生成: python3 tools/make_character_a_frames.py
"""
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import game_canvas as GC  # noqa: E402
import make_assets as MA  # noqa: E402

ROOT = MA.ROOT
OUT = os.path.join(ROOT, "assets/characters/character_a/frames")

# 関節付近 (中心, 半径) は土台に元の画素を残し、回した部位の下で継ぎ目が透けないようにする
KEEP_JOINTS = [
    (478, 500, 22),   # 右前腕の付け根 (肘)
    (172, 420, 14),   # 刀を握る手と袖のつなぎ目
]


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(MA.PREVIEW_DIR, exist_ok=True)
    rgb = np.array(Image.open(MA.SRC).convert("RGB"))
    mask = (np.array(Image.open(MA.OUT_MASK)) > 0).astype(np.uint8)   # 人物A と同じマスク

    sub_rgb = rgb[MA.CY0:MA.CY1, MA.CX0:MA.CX1].astype(np.float32)
    sub_a = mask[MA.CY0:MA.CY1, MA.CX0:MA.CX1].astype(np.float32)[..., None]
    P = np.concatenate([sub_rgb * sub_a, sub_a], axis=-1)
    rig = MA.Rig(P, mask[MA.CY0:MA.CY1, MA.CX0:MA.CX1], keep_joints=KEEP_JOINTS)

    frames = []
    for i, prm in enumerate(MA.FRAMES, 1):
        p = rig.render(prm["lean"], prm["sway"], prm["fore"], prm["sword"])
        img = GC.to_game_rgba8(p)
        Image.fromarray(img, "RGBA").save(os.path.join(OUT, f"character_a_{i:02d}.png"))
        frames.append(img)

    # 確認 1: 1 枚目は静止画 character_a.png と一致する
    still = np.array(Image.open(os.path.join(ROOT, "assets/characters/character_a/character_a.png"))).astype(int)
    print("frame01 と character_a.png の最大差:", int(np.abs(frames[0].astype(int) - still).max()))

    # 確認 2: 足元 (最も低い点の中心) と、キャンバスの縁にはみ出していないか
    for i, f in enumerate(frames, 1):
        a = f[..., 3]
        ys, xs = np.where(a >= 64)
        low = ys >= ys.max() - 2
        edge = int(a[0].max() + a[-1].max() + a[:, 0].max() + a[:, -1].max())
        print(f"frame{i:02d}: 足元 x={xs[low].mean():.1f} 下端 y={ys.max() + 1}  外接 x{xs.min()}..{xs.max()} y{ys.min()}..{ys.max()}  縁のalpha合計={edge}")

    # 確認用 GIF (実際の表示時間、市松の上)
    bgc = np.zeros((GC.CANVAS, GC.CANVAS, 3), np.uint8)
    for cy in range(0, GC.CANVAS, 16):
        for cx in range(0, GC.CANVAS, 16):
            bgc[cy:cy + 16, cx:cx + 16] = 226 if (cx // 16 + cy // 16) % 2 == 0 else 204
    gif = []
    for f in frames:
        al = f[..., 3:4].astype(np.float32) / 255.0
        gif.append(Image.fromarray((f[..., :3] * al + bgc * (1 - al) + 0.5).astype(np.uint8)))
    gif[0].save(os.path.join(MA.PREVIEW_DIR, "character_a.gif"), save_all=True, append_images=gif[1:],
                duration=[p["ms"] for p in MA.FRAMES], loop=0)


if __name__ == "__main__":
    main()
