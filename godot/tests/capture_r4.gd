extends SceneTree
## R4 の確認用。main シーンを開き、操作を自動で入れながら画面を保存する。
## 実行: xvfb-run -a godot --path godot -s res://tests/capture_r4.gd -- <出力ディレクトリ>

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var out_dir: String = args[0] if args.size() > 0 else OS.get_user_data_dir()
	var main: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(main)
	var player: Node2D = main.get_node("Player")
	await _frames(10)
	_shot(out_dir, "r4_1_start.png", player)
	await _hold("move_up", 40)       # 奥へ
	_shot(out_dir, "r4_2_deeper.png", player)
	await _hold("move_left", 40)     # 左（大江山の方向）へ
	_shot(out_dir, "r4_3_left.png", player)
	await _hold("move_right", 20)    # 右へ（左右反転の確認）
	_shot(out_dir, "r4_4_right.png", player)
	quit()


func _frames(n: int) -> void:
	for i in n:
		await process_frame


func _hold(action: String, n: int) -> void:
	Input.action_press(action)
	await _frames(n)
	Input.action_release(action)
	await _frames(3)


func _shot(out_dir: String, name: String, player: Node2D) -> void:
	var img := root.get_texture().get_image()
	img.save_png(out_dir.path_join(name))
	print("%s: world_x=%.1f world_z=%.1f facing=%d screen=%s z_index=%d" % [name, player.world_x, player.world_z, player.facing, player.position, player.z_index])
