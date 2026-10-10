extends Node2D
## 源頼光。R4 では MASTER の静止画を斜投影の地面に立たせ、操作で動かせるようにするだけ（アニメーションなし）。

const DISPLAY_HEIGHT := 240.0 # 画面上の背丈（px）【要確認】
const SPEED := 100.0          # 左右の速さ（px/秒）。歩きの 1 歩の長さに合わせて落ち着いた速さにした（docs/DECISIONS.md D13）
const DEPTH_SPEED := 64.0     # 奥行きの速さ（以前の 左右:奥行き = 235:150 の比を保つ）

# 歩行（WALK）: tools/make_walk_cutout.py が作った 6 コマ。コマは時間ではなく「進んだ距離」で切り替える。
# 接地している足が地面に対して滑らないよう、コマが 1 つ進むたびに足が 2 × STRIDE / 3 だけ後ろへ動く絵になっている。
const WALK_FRAME_PATH := "res://assets/characters/raiko/walk/%02d.png"
const WALK_FRAME_COUNT := 6
const WALK_STRIDE_SRC := 70.0   # 元の絵での足の前後の振れ幅の半分（tools/make_walk_cutout.py の STRIDE と同じ値）
const WALK_START_FRAME := 1     # 歩き出しのコマ（0 始まり）。立ち姿に最も近い（左足が元の位置）コマから始める

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
var _stand_texture: Texture2D           # 立ち姿（MASTER）
var _walk_textures: Array[Texture2D] = []
var _walk_step_px := 1.0                # 歩きのコマが 1 つ進むのに必要な移動距離（画面の px）
var _walk_dist := 0.0                   # 歩き出してから進んだ距離（画面の px）
var _was_moving := false
var walk_frame := -1                    # 現在の歩きのコマ（0 始まり）。立っているときは -1

@onready var sprite: Sprite2D = $Sprite


func _ready() -> void:
	# 画像の余白を除いた人物の範囲から、足元の中央をこのノードの原点に合わせる。
	# 位置の基準は立ち姿（MASTER）から 1 度だけ求め、歩きのコマにも同じ値を使う（コマごとに求めると足の動きで胴がずれる）
	_stand_texture = sprite.texture
	var used := _stand_texture.get_image().get_used_rect()
	sprite.centered = false
	sprite.offset = -Vector2(used.position.x + used.size.x * 0.5, used.position.y + used.size.y)
	_scale = DISPLAY_HEIGHT / float(used.size.y)
	_walk_step_px = 2.0 * WALK_STRIDE_SRC * _scale / 3.0
	for i in WALK_FRAME_COUNT:
		var tex: Texture2D = load(WALK_FRAME_PATH % (i + 1))
		assert(tex.get_size() == _stand_texture.get_size(), "歩きのコマは立ち姿と同じ大きさのキャンバスにする")
		_walk_textures.append(tex)
	_place()


func _process(delta: float) -> void:
	var mx := Input.get_axis("move_left", "move_right")
	var mz := Input.get_axis("move_down", "move_up")
	var before := Oblique.to_screen(world_x, world_z)
	world_x += mx * SPEED * delta
	world_z = clampf(world_z + mz * DEPTH_SPEED * delta, 0.0, Oblique.DEPTH_MAX)
	if mx != 0.0:
		facing = signi(int(signf(mx)))
	var moved := Oblique.to_screen(world_x, world_z).distance_to(before)
	_update_walk(moved)
	_update_breath(delta, _was_moving)
	_place()


## 動いている間は、進んだ距離でコマを切り替える（地面に対して足が滑らない）。止まると立ち姿に戻る。
func _update_walk(moved: float) -> void:
	var moving := moved > 0.0
	if moving and not _was_moving:
		_walk_dist = WALK_START_FRAME * _walk_step_px # 立ち姿に近いコマから歩き出す
	if moving:
		_walk_dist += moved
		walk_frame = int(_walk_dist / _walk_step_px) % WALK_FRAME_COUNT
		sprite.texture = _walk_textures[walk_frame]
	elif _was_moving:
		walk_frame = -1
		sprite.texture = _stand_texture
	_was_moving = moving


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
