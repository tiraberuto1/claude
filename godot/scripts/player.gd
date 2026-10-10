extends Node2D
## 源頼光。R4 では MASTER の静止画を斜投影の地面に立たせ、操作で動かせるようにするだけ（アニメーションなし）。

const DISPLAY_HEIGHT := 240.0 # 画面上の背丈（px）【要確認】
const SPEED := 235.0          # 左右の速さ（px/秒）
const DEPTH_SPEED := 150.0    # 奥行きの速さ

@export var world_x := 640.0
@export var world_z := 120.0
var facing := -1 # -1 = 左向き（大江山の方向）。MASTER は顔が左を向いている
var _scale := 1.0

@onready var sprite: Sprite2D = $Sprite


func _ready() -> void:
	# 画像の余白を除いた人物の範囲から、足元の中央をこのノードの原点に合わせる
	var used := sprite.texture.get_image().get_used_rect()
	sprite.centered = false
	sprite.offset = -Vector2(used.position.x + used.size.x * 0.5, used.position.y + used.size.y)
	_scale = DISPLAY_HEIGHT / float(used.size.y)
	_place()


func _process(delta: float) -> void:
	var mx := Input.get_axis("move_left", "move_right")
	var mz := Input.get_axis("move_down", "move_up")
	world_x += mx * SPEED * delta
	world_z = clampf(world_z + mz * DEPTH_SPEED * delta, 0.0, Oblique.DEPTH_MAX)
	if mx != 0.0:
		facing = signi(int(signf(mx)))
	_place()


func _place() -> void:
	position = Oblique.to_screen(world_x, world_z)
	z_index = -int(world_z) # 奥にいるものほど後ろに描く
	sprite.scale = Vector2(_scale * (1.0 if facing < 0 else -1.0), _scale) # 右へ進むときは足元を軸に左右反転
