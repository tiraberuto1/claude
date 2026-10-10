extends Node2D

# R4 確認用のシーン。操作の割り当てを登録し、MASTER の静止画を斜投影の地面に立たせる。
func _ready() -> void:
	Controls.setup()
	print("shuten-emaki: boot ok")
