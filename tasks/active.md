# 進行中の作業

使い方: 作業を始めるときに書き換える。完了したら「状態」を「完了」にし、要点を `handoff.md` に移す。

## 目的

shuten-doji-animation-prototype の動きが、SPEC の成功条件である「絵巻が動いた」に当てはまるかを判断し、必要なら動きを小さくする。

## 対象

- `shuten-doji-animation-prototype/tools/make_frames.py`（`FRAMES` 表）
- `shuten-doji-animation-prototype/assets/characters/samurai_left_bottom/samurai_02〜07.png`

## 完了条件

- 持ち主がスマートフォンで見て、「絵巻が動いた」と判断している
- フレーム 01 と 08 が元絵と画素単位で一致したままである

## 状態

利用者の評価待ち。ブラウザ確認用のページは Artifact として公開済み（URL は会話の記録に残っている）。

## 検証の証拠

- 袖口が刀の層に入る問題を直した（コミット 723604c）
- ヘッドレスブラウザで、8 フレームが順に進み、停止すると 1 フレーム目に戻ることを確かめた（以前のセッション）
