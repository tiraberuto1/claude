# AI 作業環境のセットアップ報告

- 実施日: 2026-10-06
- 対象: リポジトリのルート `/home/user/claude`（利用者の指定。3 つの案件を含む）
- 環境: Linux、bash、Claude Code 2.1.291、Python 3.11.15、Node v22.22.2
- 参照した仕様: code.claude.com/docs/en/ の memory、settings、permissions、hooks、skills、sub-agents、sandboxing（実施日に取得）
- Git: commit と push はしていない。変更はすべて作業ツリー上にある

## 作成・変更したファイル

| ファイル | 種類 | 内容 |
|---|---|---|
| `CLAUDE.md` | 変更 | Claude 用の短い入口。`@AGENTS.md` で共通の方針を読み込む |
| `AGENTS.md` | 新規 | 全ツール共通の方針の正本（70 行） |
| `.gitignore` | 新規 | バックアップ、個人設定、ログを除外する（ルートには元々なかった） |
| `docs/ai/context.md` | 新規 | 目的、読者、参照資料、確定事項、未確認事項 |
| `docs/ai/checks.md` | 新規 | 作業ごとの合格条件と検査コマンド |
| `docs/ai/setup-report.md` | 新規 | この報告 |
| `tasks/active.md`、`tasks/handoff.md` | 新規 | 進行中の作業と引き継ぎ |
| `outputs/README.md` | 新規 | 成果物の置き場所の説明 |
| `.claude/settings.json` | 新規 | 秘密ファイルの拒否ルールと、Stop Hook |
| `.claude/rules/shuten-doji-prototype.md` | 新規 | `shuten-doji-animation-prototype/**` を扱うときだけ読み込まれる |
| `.claude/rules/single-file-html.md` | 新規 | `shuten-emaki/**` と `sekigahara/**` を扱うときだけ読み込まれる |
| `.claude/rules/japanese-writing.md` | 新規 | docs、tasks、outputs、README、SPEC を扱うときだけ読み込まれる |
| `.claude/skills/project-work/SKILL.md` | 新規 | `/project-work` 標準の作業手順 |
| `.claude/skills/project-check/SKILL.md` | 新規 | `/project-check` 合格条件での検査 |
| `.claude/agents/project-reviewer.md` | 新規 | 読み取り専用の確認役（Read、Grep、Glob） |
| `.claude/scripts/check_ai_setup.py` | 新規 | 設定の検査（標準ライブラリだけ）。Stop Hook からも呼ぶ |
| `.claude/scripts/test_check_ai_setup.py` | 新規 | 上の検査の単体テスト（一時フォルダだけを使う） |

Git の管理外: `.ai-setup-backup/initial/`（元の CLAUDE.md、元の HEAD、元の `git status`）。

## 採用した構成

- 指示書: AGENTS.md を正本にし、CLAUDE.md から `@AGENTS.md` で読み込む。公式資料によると、CLAUDE.md がある場合、Claude Code は AGENTS.md を直接は読まない。そのため import で読み込む形にした（読み込み設定が既定の場合）。
- 案件ごとのルールは、`paths` 付きの Rules に分けた。常に読み込まれるルールは作っていない。
- 詳しい資料（`docs/ai/*`）は import せず、CLAUDE.md の中で、用途と一緒に場所を示すだけにした。
- 元の CLAUDE.md のうち、日本語で書くこと、コミット形式、ブランチは AGENTS.md に移した。「このリポジトリは Claude Code 用の superpowers プラグイン」という概要は、実際の中身（絵巻の試作 3 つ）と合わないので採らず、未確認事項として `context.md` に記録した。原文は `.ai-setup-backup/initial/CLAUDE.md` にある。

## 実行した検査と結果

| 検査 | 結果 |
|---|---|
| `python3 .claude/scripts/check_ai_setup.py` | 成功（失敗 0、注意 0） |
| `python3 .claude/scripts/test_check_ai_setup.py` | 成功（18 件。正常、異常 9 種、再ブロック防止、不正な stdin、終了コード 2 にしない、所要時間、timeout の値、ファイルを変えない） |
| settings.json の Hook コマンドを `sh -c` で直接実行 | 正常時は出力なし（exit 0）。必須ファイルがない一時フォルダでは `decision: block`。`stop_hook_active: true` では出力なし。スクリプトがなければ exit 0。所要時間 33ms |
| 外部から読み込むものを Grep で確認 | Google Fonts と、`sekigahara` の three.js r128（cdnjs）。Rules の記述を実際に合わせて直した |
| 独立レビュー（project-reviewer） | **未実施**。セッションの途中で作った Subagent は、このセッションでは起動できなかった。代わりに私が観点を変えて点検した（SPEC の節番号、ファイルの実在、.gitignore の効き方、AGENTS.md に @import がないこと） |

Hook の時間切れについて: 打ち切りそのものは Claude Code 側の処理なので、実機では試していない。確認したのは、timeout が 15 秒に設定されていることと、実際の所要時間が数十ミリ秒であることだけ。

## 未適用・未確認の項目

- **新しいセッションでの読み込み**: 未確認。設定ファイルを置いただけで、画面上で読み込まれたかは見ていない。次の「利用者が確かめること」で確認する。
- **YAML frontmatter**: 簡易的な読み取りで確かめただけ。正式な YAML の検証はしていない。`claude plugin validate .claude/agents` を使えば検証できると公式資料にあるが、実行していない。
- **Sandbox**: 公式資料では、Linux は対応 OS で、`bubblewrap` と `socat` が必要とされる。この環境にはどちらも見つからなかった。有効化は利用者の操作として次に案内する。適用されるのはシェルコマンドだけで、ファイル操作のツール、Hook、MCP は対象外（公式資料による）。
- **秘密ファイルの拒否ルールの限界**: Read/Edit の拒否は、Claude のファイル操作ツールと、`cat` のように Claude Code がファイル操作と認識できるコマンドにしか効かない。Python のスクリプトなどが自分でファイルを開く場合は防げない。`.gitignore` や CLAUDE.md の記述にも、読み取りを防ぐ力はない。
- **既存の過剰な権限**: なし。ユーザー設定（`~/.claude/settings.json`）は存在しない。管理者の方針ファイル（`~/.claude/policy-limits.json`）は、中身を見ていない。
- **Codex**: 見つからなかった（`codex` コマンドも `~/.codex` もない）。AGENTS.override.md は存在しない。Codex での動作は確認していない。
- **MCP**: 追加していない。
- **Git で追跡済みの秘密らしいファイル**: ファイル名で探した範囲では見つからなかった。
- **`.env.*` の拒否**: `.env.example` のような見本のファイルも読めなくなる。必要なら個人設定で調整する。

## 利用者が確かめること（新しいセッションで）

1. `/memory`: CLAUDE.md と AGENTS.md が読み込まれているか
2. `/context`: 指示書が占める量
3. `/hooks`: Stop に検査の Hook が 1 つだけあるか
4. `/permissions`: 拒否ルールが 8 件入っているか
5. `/` を入力: コマンド一覧に `project-work`、`project-check` があるか
6. 「project-reviewer で確認して」と頼み、Subagent が起動するか（このバージョンの `/agents` は案内を表示するだけ）
7. Sandbox を使う場合: `bubblewrap` と `socat` を入れてから `/sandbox`（パッケージの追加になるので、今回は実施していない）

## 今回の変更だけを元に戻す手順

`git reset --hard` や `git clean` は使いません。

```sh
cd /home/user/claude
cp .ai-setup-backup/initial/CLAUDE.md CLAUDE.md
rm AGENTS.md .gitignore outputs/README.md
rm docs/ai/context.md docs/ai/checks.md docs/ai/setup-report.md
rm tasks/active.md tasks/handoff.md
rm .claude/settings.json .claude/agents/project-reviewer.md
rm .claude/rules/shuten-doji-prototype.md .claude/rules/single-file-html.md .claude/rules/japanese-writing.md
rm .claude/skills/project-work/SKILL.md .claude/skills/project-check/SKILL.md
rm .claude/scripts/check_ai_setup.py .claude/scripts/test_check_ai_setup.py
rm -rf .claude/scripts/__pycache__
find docs tasks outputs .claude -type d -empty -delete   # 空になったフォルダだけ消す
git status --short   # 変更が残っていないこと、他人の変更を消していないことを確かめる
```

その後、不要になったら `.ai-setup-backup/` も削除します。

## 再実行したときの扱い

- バックアップは、`.ai-setup-backup/initial/` がすでにあれば作り直さない（最初の状態を守る）。
- Hook の重複と、権限ルールの重複は、検査スクリプトが失敗として報告する。
- Rules、Skills、Subagent は名前が決まっているので、再実行すると同じファイルを更新するだけで、数は増えない。
