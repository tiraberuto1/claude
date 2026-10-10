extends Node2D
## 源頼光。R4 では MASTER の静止画を斜投影の地面に立たせ、操作で動かせるようにするだけ（アニメーションなし）。

const DISPLAY_HEIGHT := 240.0 # 画面上の背丈（px）【要確認】
const SPEED := 235.0          # 左右の速さ（px/秒）
const DEPTH_SPEED := 150.0    # 奥行きの速さ

# 待機（IDLE）: 絵は描き変えず、MASTER の静止画をごくわずかに縦へ伸縮させて呼吸を表す。
# 指示書 §5.2「必要以上に呼吸や揺れを誇張しない」。傾き・横揺れは付けない（絵巻らしさのため）。
const BREATH_AMPLITUDE := 0.008 # 背丈に対する伸縮の幅（0.8%）
const BREATH_PERIOD := 3.6      # 1 回の呼吸の長さ（秒）
const BREATH_EASE := 8.0        # 動き出し・止まったときに元の大きさへ戻す速さ

@export var world_x := 640.0
@export var world_z := 120.0
var facing := -1 # -1 = 左向き（大江山の方向）。MASTER は顔が左を向いている
var _scale := 1.0
var _breath_t := 0.0     # 呼吸の位相（0 から始まり、止まるたびに 0 に戻る）
var _breath_amp := 0.0   # 現在の振幅の割合（動いている間は 0、止まると 1 へ）

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
	_update_breath(delta, mx != 0.0 or mz != 0.0)
	_place()


## 待機中だけ呼吸させる。動き出したら元の大きさへ戻し、止まったら位相 0（元の大きさ）から再開するので跳ねない。
func _update_breath(delta: float, moving: bool) -> void:
	if moving:
		_breath_amp = move_toward(_breath_amp, 0.0, BREATH_EASE * delta)
		_breath_t = 0.0
	else:
		_breath_amp = move_toward(_breath_amp, 1.0, BREATH_EASE * delta)
		_breath_t += delta


func _breath_factor() -> float:
	# sin は位相 0 で 0（元の大きさ）から始まり、(1 - cos) で常に 0 以上にして「息を吸って戻る」形にする
	var wave := 0.5 * (1.0 - cos(TAU * _breath_t / BREATH_PERIOD))
	return 1.0 + BREATH_AMPLITUDE * wave * _breath_amp


func _place() -> void:
	position = Oblique.to_screen(world_x, world_z)
	z_index = -int(world_z) # 奥にいるものほど後ろに描く
	# 左右反転は x だけ。呼吸は y だけ。スプライトの原点は足元なので、y を伸縮しても足は動かない
	sprite.scale = Vector2(_scale * (1.0 if facing < 0 else -1.0), _scale * _breath_factor())
