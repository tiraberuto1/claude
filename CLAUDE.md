# CLAUDE.md — Claude Code 用の入口

共通の方針は AGENTS.md が正本です。ここには Claude Code 固有のことだけを書きます。

@AGENTS.md

## Claude Code 固有

- 案件ごとのルールは `.claude/rules/` にあり、該当するファイルを読んだときに自動で読み込まれる。
- 決まった手順は Skills で始める。作業は `/project-work <依頼内容>`、検査は `/project-check <対象>`。
- 作った本人とは別の視点での確認は、Subagent `project-reviewer` に頼む（読み取り専用）。
- 設定を変えたら `python3 .claude/scripts/check_ai_setup.py` で検査する。Stop Hook でも同じ検査が動く。
- 詳しい資料は必要なときだけ読む: `docs/ai/context.md`（背景）、`docs/ai/checks.md`（合格条件）、`docs/ai/setup-report.md`（設定の経緯）。
