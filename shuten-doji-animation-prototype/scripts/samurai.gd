extends AnimatedSprite2D
## 左下の武者。SpriteFrames の 8 フレームを 12fps 基準でループ再生する。
## フレームごとの長さ（間）は SpriteFrames 側の duration 倍率で指定している。
## スペースキーで一時停止すると 1 フレーム目（＝元の絵巻と同じ画素）に戻り、静止画と比べられる。

const ANIMATION := &"swing"


func _ready() -> void:
	play(ANIMATION)


func _unhandled_input(event: InputEvent) -> void:
	if not event.is_action_pressed("toggle_play"):
		return
	if is_playing():
		stop()
		frame = 0
	else:
		play(ANIMATION)
