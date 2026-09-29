extends AnimatedSprite2D
## 左下の武者。8 枚の PNG を 12fps でループ再生するだけ (操作・当たり判定などは未実装)。
##
## フレームごとの表示時間の差 (60〜200ms) は SpriteFrames 側のフレーム duration で持たせている。
## 位置は元絵巻のピクセル座標にそろえてあるので、Background と同じ原点に置けば元の位置に重なる。

const ANIMATION := &"swing"
const FPS := 12.0


func _ready() -> void:
	sprite_frames.set_animation_speed(ANIMATION, FPS)
	sprite_frames.set_animation_loop(ANIMATION, true)
	play(ANIMATION)
