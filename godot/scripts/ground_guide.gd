extends Node2D
## 確認用のガイド線（ゲーム素材ではない）。斜投影の地面を細い線で示す。背景素材ができたら外す。

const COLOR := Color(0.85, 0.8, 0.7, 0.35)


func _draw() -> void:
	for z in range(0, int(Oblique.DEPTH_MAX) + 1, 40):
		draw_line(Oblique.to_screen(-400.0, z), Oblique.to_screen(1800.0, z), COLOR, 1.0)
	for x in range(-400, 1801, 100):
		draw_line(Oblique.to_screen(x, 0.0), Oblique.to_screen(x, Oblique.DEPTH_MAX), COLOR, 1.0)
