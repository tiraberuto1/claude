extends SceneTree
## WALK（歩行）の確認用。60fps に固定して歩かせ、全フレームの画面と、そのときのコマ・位置を保存する。
##   xvfb-run -a godot --path godot --fixed-fps 60 -s res://tests/capture_walk.gd -- <出力ディレクトリ>

var out_dir := ""
var log_lines: PackedStringArray = []


func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	out_dir = args[0] if args.size() > 0 else OS.get_user_data_dir()
	var main: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(main)
	var player: Node2D = main.get_node("Player")
	await _frames(5)
	_shot("a_idle", player)
	Input.action_press("move_left")                   # 左（進行方向）へ 1.5 秒歩く
	for i in 90:
		await process_frame
		_shot("w_%03d" % i, player)
	Input.action_release("move_left")
	await _frames(1)
	_shot("b_stop_0", player)                          # 止まった直後
	await _frames(40)
	_shot("b_stop_1", player)
	Input.action_press("move_right")                  # 右へ（左右反転の確認）
	for i in 30:
		await process_frame
		_shot("r_%03d" % i, player)
	Input.action_release("move_right")
	await _frames(2)
	Input.action_press("move_up")                     # 奥へ（奥行きの移動でも歩くか）
	for i in 30:
		await process_frame
		_shot("u_%03d" % i, player)
	Input.action_release("move_up")
	await _frames(2)
	var f := FileAccess.open(out_dir.path_join("log.txt"), FileAccess.WRITE)
	f.store_string("\n".join(log_lines))
	quit()


func _frames(n: int) -> void:
	for i in n:
		await process_frame


func _shot(name: String, player: Node2D) -> void:
	root.get_texture().get_image().save_png(out_dir.path_join(name + ".png"))
	log_lines.append("%s frame=%d x=%.2f y=%.2f scale=%s breath_amp=%.2f" % [name, player.walk_frame, player.position.x, player.position.y, player.sprite.scale, player._breath_amp])
