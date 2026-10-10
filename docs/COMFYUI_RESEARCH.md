# ComfyUI によるローカル画像生成: 調査結果と手順

作成: 2026-10-10 / 対象環境: RTX 3060 12GB（ユーザーのPC）
位置づけ: **調査と提案**。`CLAUDE.md` の制作ルール（画像は ChatGPT に発注）を変える内容を含むため、§7 の承認があるまで実施しない。

## 0. 先に読む注意
- 以下の VRAM・時間・メモリの数字は**すべてウェブ上の記事の記述で、3060 での実測ではない**（「未検証」）。記事どうしで食い違うものもある。
- 実際に生成するのは**ユーザーのPC**。この Claude Code のコンテナには GPU がなく、Hugging Face にも接続できない（今回確認）。そのため **Claude Code が担当できるのは「プロンプト・ワークフロー JSON・後処理スクリプト・検収の計測」まで**。
- **ライセンスは今回、モデルカードを確認できなかった**。すべて「要確認」。商用リリースを考えるなら、モデルを決める前に必ず公式カードを読む（§6）。

## 1. このプロジェクトの失敗と、ComfyUI での対策
`docs/PROGRESS.md` §4〜5 の問題を出発点にする。

| 現状の問題（ChatGPT 発注） | ComfyUI での対策 |
|---|---|
| 振りかぶりで腕が 3 本になり、修正 2 回でも直らない | 骨格（OpenPose）で姿勢を指定する ControlNet、または姿勢画像を 2 枚目の入力にする編集モデル |
| 斬り下ろしの顔が劇画寄り | 顔だけ**インペイント**（マスク範囲だけ描き直す）。MASTER の顔を参照にする |
| コマごとに絵全体が描き直されてちらつく（#002） | シード固定で、MASTER を元に**編集**する（ゼロから再生成しない） |
| 格子・コマ数・区画の指示が守られない | **1 回に 1 コマ**生成して、コードでシートに並べる。ComfyUI は何コマでもバッチ実行できる |
| 添付した基準画像をそのまま写される | ComfyUI では逆に利点。参照を入れたまま姿勢・腕・刀だけ変える使い方ができる |
| 納品に市松模様や薄い画素が混ざる | BiRefNet で背景除去 → 既存の `tools/normalize_alpha_png.py` で整える |

## 2. 方式の候補と推奨順位

| 順位 | 方式 | 役割 | 12GB での見込み（未検証） | 向く作業 |
|---|---|---|---|---|
| 1（主） | **画像編集モデル**: Qwen-Image-Edit（GGUF）または FLUX.1 Kontext（GGUF/fp8） | MASTER を渡して「構えを変える」「刀を振り上げる」 | Qwen-Edit は Q4 GGUF で約 12GB の記述あり。別記事は FLUX Kontext fp8 で最低 11GB、一方 20GB 必要とする記述もあり食い違う。**システム RAM 32GB 以上が目安**との記述あり | ATTACK/HIT/DEATH の各姿勢、顔の修正 |
| 2（補助・修復） | **SDXL 系 ＋ ControlNet（OpenPose/Canny）＋ IPAdapter ＋ インペイント** | 姿勢の強制、部分の描き直し | SDXL は 12GB に余裕で収まる（定番）。ただし 3060 の速度は未検証 | 腕の数・刀の向きの修正、顔のインペイント |
| 3（後日） | **頼光 LoRA / 絵巻画風 LoRA**（kohya、SDXL ベース） | 絵柄・人物の固定 | 12GB で SDXL LoRA 学習は可能との記述が複数。FLUX の LoRA 学習は 12GB で可否が記事により割れる | 採用画像が **15〜30 枚以上**たまってから。現在は MASTER＋歩行＋攻撃の数枚で足りない |
| 4（実験） | **動画生成**（Wan 2.2 の 5B・14B GGUF、AnimateDiff） | 動きの下書き | 3060 12GB は Wan 2.2 5B・480p 程度との記述。実測なし | 画風の一貫性・透過・コマ精度が不利。ゲームのコマ素材には向かない公算が大きい。試すなら最後 |

推奨: **1 を主にし、2 を修復に使う。3 は素材が貯まってから。4 は本件では後回し。**

補助ツール:
- **背景除去**: ComfyUI 標準テンプレート「BiRefNet: Remove Background」（出力は RGBA とマスク。1 枚ずつ処理。極端に複雑な背景は苦手）。カスタムノード ComfyUI-RMBG には RMBG-2.0・BiRefNet・BEN2 などが入っている。縁の紙色が混ざる問題（旧スプライトで確認済み）には、マスクの縁を少し縮める設定が使える。
- **GGUF 読み込み**: カスタムノード ComfyUI-GGUF（City96）。ComfyUI-Manager から入れる。
- **顔・手の修復**: Impact Pack の FaceDetailer（再描画強度 0.4 前後・シード固定との記述）。

## 3. ライセンス（要確認の一覧）
今回はモデルカードを読めていない。**記憶や記事で埋めない**。ユーザーが各モデルの Hugging Face ページで確認し、結果をこの表に記入する。

| 対象 | 確認すること | 状態 |
|---|---|---|
| FLUX.1 Kontext [dev] | 出力物の商用利用可否、モデル自体の制限 | 要確認 |
| FLUX.1 [dev]（LoRA 学習のベースにする場合） | 同上 | 要確認 |
| Qwen-Image-Edit / 2509 / 2511（記事に「新版は研究用ライセンス」という未確認の記述あり） | 版ごとのライセンス | 要確認 |
| RMBG-2.0 | 商用利用可否（記事は要確認と注意） | 要確認 |
| BiRefNet | ライセンス | 要確認 |
| SDXL ベース／派生チェックポイント（Illustrious 系など） | 派生ごとに異なる | 要確認 |
| ControlNet・IPAdapter・Wan 2.2 | 各モデル | 要確認 |

加えて、**参照画像（サントリー本）で画風 LoRA を学習すること**は、未決 Q1（基準画面の出典・利用条件が未確認）と直結する。出典が確認できるまで、その画像を学習データに入れない。

## 4. 手順

### 4.1 ユーザーがやること（ローカル。所要は初回 半日程度の見込み）
1. 要確認: OS（Windows か Linux か）、システム RAM（32GB 以上か）、空きディスク（モデル合計で数十 GB）、NVIDIA ドライバ。
2. ComfyUI を入れる（公式のデスクトップ版またはポータブル版）。ComfyUI-Manager、ComfyUI-GGUF を追加。
3. モデルを配置:
   - GGUF の拡散モデル → `ComfyUI/models/diffusion_models/`
   - テキストエンコーダ → `ComfyUI/models/text_encoders/`（Qwen 系は約 9.4GB の記述あり）
   - BiRefNet → `ComfyUI/models/background_removal/`（公式ドキュメントの記述。版により異なる可能性があるので要確認）
4. §3 のライセンス確認。
5. 動作テスト: 標準テンプレートの画像編集を MASTER 1 枚で実行し、**1 枚あたりの時間と VRAM 使用量を測って報告**（この数字が以後の判断材料）。

### 4.2 Claude Code が提供するもの
- 編集指示プロンプト（日本語/英語）、ワークフロー JSON（ComfyUI の API 形式。ただし**ここでは実行確認できない**。ユーザーの環境で開けるかの確認が必要）
- 後処理スクリプト: 生成物を MASTER と同じキャンバス（681×1598）・足元基準にそろえる。既存の `tools/normalize_alpha_png.py` を流用
- 検収の計測（透過・余白・向き）と Godot への組み込み

### 4.3 最初の試験運用（パイロット）
目的: **今止まっている R6 の 2 コマで、ChatGPT より良くなるかを判定する**。比較対象（納品済み・未納品）が手元にある。

| 試験 | 入力 | 合格の目安（ユーザーが目で判断） |
|---|---|---|
| A. 振りかぶり | 構え（合格済み）＋ 姿勢画像（棒人形） | 腕が 2 本・両手で刀を頭上・MASTER と同じ服装 |
| B. 斬り下ろしの顔修正 | 姿勢合格済みの斬り下ろし＋ MASTER の顔 | 顔が絵巻風（D9）で、体の絵は変わらない |

手順（各試験）: ① 参照画像を入力 → ② 生成を**シード固定で 4〜8 枚** → ③ 背景除去（BiRefNet）→ ④ 候補を `docs/asset-requests/deliveries/` と同形式で保存 → ⑤ Claude Code が計測 → ⑥ ユーザーが採用を決める。うまくいかなければ SDXL＋OpenPose ControlNet（補助方式）に切り替える。

### 4.4 パイロットが通ったら
- ATTACK 残心、HIT、DEATH を同じ方式で作る。
- 敵（赤鬼など）、酒呑童子、四天王、背景（絵巻の分割方針は未決）。背景は**LoRA 学習が効く領域**なので、採用画像がそろってから LoRA を検討。
- 動きが多い場面（WALK の腕を動かすなど）は、現状の切り紙を ComfyUI の姿勢制御で作り直す案がある。

## 5. 限界・リスク（正直に）
- 3060 12GB は**ぎりぎり**。Q4 などの量子化で画質が落ちる、生成が 1 枚あたり分〜十数分かかる可能性（未検証）。
- 編集モデルでも、繰り返すと別人に寄ることがある（記事の記述）。基準は常に MASTER に戻す。
- 「顔だけ横・胴は正面」などの癖が、ChatGPT と同様に出る可能性は消えない。ただし姿勢は ControlNet で強制でき、顔はインペイントで直せる点が違う。
- 画風を絵巻に寄せる能力はモデル次第。**パイロットで一番見るべき点**。

## 6. 要確認（ユーザーへ）
1. PC の OS・システム RAM・空きディスク
2. 各モデルのライセンス（§3 の表）と、商用リリースの予定の有無
3. サントリー本参照画像の出典・利用条件（Q1。LoRA 学習に使うかどうかに影響）
4. ChatGPT との併用方針（§7）

## 7. 提案する決定事項（D15 案・**承認待ち。`DECISIONS.md` と `CLAUDE.md` は未変更**）
- D15 案: 画像の制作担当に **ローカル ComfyUI を加える**。ユーザーがPCで生成し、Claude Code は指示・後処理・計測・組み込みを担当する。Claude Code 自身が画像を生成するわけではない（コンテナに GPU なし）。API キー・画像生成 API は使わない（既存ルールのまま）。
- D12・D14 の例外規定と ChatGPT 発注（#005）の扱い: ComfyUI のパイロットの結果を見て、続行か置き換えかを決める。
- 承認されたら: `CLAUDE.md` の「制作ルール」の文言と `docs/DECISIONS.md` を更新する。

## 出典（今回の検索で参照。いずれも二次情報で、設定値は未検証）
- [How to create consistent character from different viewing angles（stable-diffusion-art）](https://stable-diffusion-art.com/consistent-character-view-angle)
- [How to Keep a Character Consistent in ComfyUI（flick.art）](https://flick.art/blog/img2img-consistent-character/comfyui)
- [Flux.1 Kontext Dev ComfyUI 対応（comfyui-wiki）](https://comfyui-wiki.com/en/news/2025-06-26-flux-1-kontext-dev-release)
- [Flux Kontext 低VRAM ワークフロー（aistudynow）](https://aistudynow.com/flux-1-kontext-comfyui-workflow-low-vram-setup-with-cache-lora/)
- [ComfyUI Qwen Image Edit 低VRAM（GGUF vs FP8）](https://aistudynow.com/comfyui-qwen-image-edit-low-vram-workflow-gguf-vs-fp8/)
- [Qwen Image 2.1 ローカル実行（codersera。研究用ライセンスの記述は未確認）](https://codersera.com/blog/how-to-run-qwen-image-2-1-locally-2026/)
- [ComfyUI Video Generation: Wan / AnimateDiff（eastondev）](https://eastondev.com/blog/en/posts/ai/20260723-comfyui-video-generation-guide/)
- [Wan 2.2 Image-to-Video GGUF 低VRAM（nextdiffusion）](https://www.nextdiffusion.ai/tutorials/how-to-run-wan22-image-to-video-gguf-models-in-comfyui-low-vram)
- [ComfyUI Wan 2.2 image to video（runflow。同社は GPU API を販売）](https://www.runflow.io/blog/comfyui-wan-2-2-image-to-video)
- [Flux LoRA 学習 12GB（dev.to）](https://dev.to/thurmon_demich/best-gpu-for-fluxgym-in-2026-5-picks-for-flux-lora-training-pp6)
- [Kohya SS LoRA Training ガイド（apatero）](https://apatero.com/blog/kohya-ss-lora-training-complete-guide-2025)
- [SDXL LoRA 学習のパラメータ（Hugging Face フォーラム）](https://discuss.huggingface.co/t/perfect-lora-training-parameters-human-character/147211)
- [BiRefNet 背景除去（ComfyUI 公式ドキュメント）](https://docs.comfy.org/tutorials/utility/remove-background-birefnet)
- [ComfyUI-RMBG（GitHub）](https://github.com/sqwu/comfyui-rmbg)
