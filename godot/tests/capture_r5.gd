extends SceneTree
## R5（待機の呼吸）の確認用。呼吸 1 周期ぶんの画面、歩いている間、止まった直後の画面を保存する。
## 時間は physics ではなく process のフレームで進むので、1 フレーム = 1/60 秒に固定して実行する:
##   xvfb-run -a godot --path godot --fixed-fps 60 -s res://tests/capture_r5.gd -- <出力ディレクトリ>

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var out_dir: String = args[0] if args.size() > 0 else OS.get_user_data_dir()
	var main: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(main)
	var player: Node2D = main.get_node("Player")
	await _frames(5)
	_shot(out_dir, "idle_00_neutral", player)           # 止まっている最初のフレーム（呼吸の位相 0 付近）
	for i in range(1, 7):                                 # 3.6 秒の周期を 6 等分
		await _frames(36)
		_shot(out_dir, "idle_%02d" % i, player)
	Input.action_press("move_left")                       # 歩く
	await _frames(20)
	_shot(out_dir, "walk_0", player)
	await _frames(20)
	_shot(out_dir, "walk_1", player)
	Input.action_release("move_left")
	await _frames(1)                                       # 止まった直後
	_shot(out_dir, "stop_0", player)
	await _frames(30)
	_shot(out_dir, "stop_1", player)
	quit()


func _frames(n: int) -> void:
	for i in n:
		await process_frame


func _shot(out_dir: String, name: String, player: Node2D) -> void:
	root.get_texture().get_image().save_png(out_dir.path_join(name + ".png"))
	var sc: Vector2 = player.sprite.scale
	print("%s: scale_y_rel=%.5f breath_t=%.2f amp=%.2f pos=%s" % [name, absf(sc.y) / player._scale, player._breath_t, player._breath_amp, player.position])
