class_name Oblique
extends RefCounted
## 絵巻の斜投影（平行投影）。
## 世界座標: x = 道に沿った位置（左が大江山）、z = 画面の奥行き、h = 高さ。
## 絵巻と同じく、奥へ向かう線は一定の傾きで右上へ平行に伸び、奥にいても人物の大きさは変わらない。
## 係数は旧 Phaser 版（git 履歴 98f14ba^）の値を引き継いだ仮の値。【要確認】基準画面に合わせて調整する。

const KX := 0.7          # 奥行き 1 あたりの右へのずれ
const KY := 0.5          # 奥行き 1 あたりの上へのずれ
const GROUND_Y := 600.0  # 奥行き 0（いちばん手前）の地面の画面上の高さ
const DEPTH_MAX := 240.0 # 歩ける奥行きの上限


static func to_screen(x: float, z: float, h: float = 0.0) -> Vector2:
	return Vector2(x + z * KX, GROUND_Y - z * KY - h)
