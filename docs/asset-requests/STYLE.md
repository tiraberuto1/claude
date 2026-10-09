> ⚠️ **この内容は仮置きで、酒呑童子絵巻プロジェクトの画風とは一致しない。**
> 画風の基準は `CLAUDE_CODE_RESTART_SPEC.md` §1・§4 と `REBUILD_PLAN.md` を優先する（R0 で置き換え予定）。

# 共通スタイルガイド

全アセットのプロンプト冒頭に差し込む。作るゲームが決まったら書き換える（以下は仮置き）。

## スタイル文（プロンプトの先頭に付ける）
- 日本語: 和風の水墨画調、墨の濃淡と朱色のアクセント、太めの輪郭線、平坦な陰影
- English: Japanese sumi-e ink painting style, ink wash gradients with vermilion accents, bold outlines, flat shading

## 守ること
- 色: 墨（黒〜灰）を基調に、差し色は朱（#C8372D 付近）と金（#C9A646 付近）のみ
- 線: 輪郭は太めで均一。アセット間で太さを変えない
- 光: 左上から。影は右下へ落とす
- 背景: 単色（白）か透過。風景や床を描き込まない
- 禁止: 文字、ロゴ、ウォーターマーク、署名

## ネガティブプロンプト（共通）
text, logo, watermark, signature, extra limbs, blurry, photorealistic, busy background
