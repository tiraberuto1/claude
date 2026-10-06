---
paths:
  - "shuten-emaki/**"
  - "sekigahara/**"
---

# 単一 HTML ページ（shuten-emaki、sekigahara）の作業ルール

- どちらも CSS・JS・画像を 1 つの `index.html` にまとめた構成。ファイルを分けない。
- `shuten-emaki/index.html` は約 1.9MB で、base64 の画像を含む。全体を読み込まず、Grep で場所を見つけてから必要な行だけを読む。
- base64 の画像データは書き換えない。画像を差し替えるときは、事前に承認を得る。
- 外部から読み込んでいるのは、どちらも Google Fonts と、`sekigahara` の three.js r128（cdnjs）だけ。外部の読み込み先を増やすときは、事前に承認を得る。
- 史実の年・人名・数値を書き足したり直したりするときは、出典を示す。出典がなければ未確認と書く。
