class_name Controls
extends RefCounted
## 操作の割り当て。【要確認】docs/GAME_SPEC.md §5 の案（旧 Phaser 版の操作）を仮に使っている。
## 決まったら、ここだけ書き換える。

const KEYS := {
	"move_left": [KEY_LEFT, KEY_A],
	"move_right": [KEY_RIGHT, KEY_D],
	"move_up": [KEY_UP, KEY_W],      # 奥へ
	"move_down": [KEY_DOWN, KEY_S],  # 手前へ
	"jump": [KEY_Z, KEY_SPACE],
	"attack": [KEY_X, KEY_J],
}


static func setup() -> void:
	for action in KEYS:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for key in KEYS[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)
