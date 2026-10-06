#!/usr/bin/env python3
"""AI 作業環境の設定ファイルだけを機械的に検査する（標準ライブラリのみ）。

使い方:
  python3 .claude/scripts/check_ai_setup.py            # 結果を表示。問題があれば終了コード 1
  python3 .claude/scripts/check_ai_setup.py --hook     # Stop Hook 用。stdin の JSON を読む

検査対象はこのスクリプトから見たリポジトリ直下の固定パスだけで、再帰的な走査はしない。
YAML は正式には検証せず、frontmatter の簡易的な読み取りにとどめる。
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    "AGENTS.md",
    "CLAUDE.md",
    "docs/ai/context.md",
    "docs/ai/checks.md",
    "docs/ai/setup-report.md",
    "tasks/active.md",
    "tasks/handoff.md",
    ".claude/settings.json",
    ".claude/skills/project-work/SKILL.md",
    ".claude/skills/project-check/SKILL.md",
    ".claude/agents/project-reviewer.md",
]
SETTINGS = [".claude/settings.json", ".claude/settings.local.json"]
SKILLS = ["project-work", "project-check"]
AGENT = ".claude/agents/project-reviewer.md"
AGENT_TOOLS = {"Read", "Grep", "Glob"}
RULES_DIR = ".claude/rules"
HOOK_MARK = "check_ai_setup.py"
AGENTS_MAX_LINES = 100
IMPORT_MAX_HOPS = 4
STDIN_LIMIT = 1_000_000

FENCE = re.compile(r"^\s*(```|~~~)")
INLINE_CODE = re.compile(r"`[^`]*`")
IMPORT = re.compile(r"(?<![\w@])@([~./\w-][\w./~-]*)")


def strip_code(text):
    lines, fenced = [], False
    for line in text.splitlines():
        if FENCE.match(line):
            fenced = not fenced
            continue
        lines.append("" if fenced else INLINE_CODE.sub("", line))
    return lines


def imports_of(path):
    found = []
    for line in strip_code(path.read_text(encoding="utf-8")):
        for m in IMPORT.finditer(line):
            token = m.group(1).rstrip(".")
            if "/" in token or "." in token:
                found.append(token)
    return found


def resolve(base, token):
    if token.startswith("~"):
        return Path(token).expanduser()
    p = Path(token)
    return p if p.is_absolute() else (base.parent / p)


def check_imports(errors, warnings):
    seen_edges = set()

    def walk(path, stack):
        key = path.resolve()
        if key in stack:
            chain = " -> ".join(str(p.relative_to(ROOT)) for p in stack + [key] if p.is_relative_to(ROOT))
            errors.append(f"@import が循環している: {chain}")
            return
        if len(stack) > IMPORT_MAX_HOPS:
            warnings.append(f"@import が {IMPORT_MAX_HOPS} 段を超えている: {path.name}")
            return
        for token in imports_of(path):
            target = resolve(path, token)
            edge = (key, token)
            if edge in seen_edges:
                continue
            seen_edges.add(edge)
            if not target.resolve().is_relative_to(ROOT):
                warnings.append(f"{path.name}: リポジトリ外を @import している（初回に承認が要る）: {token}")
                continue
            if not target.is_file():
                errors.append(f"{path.relative_to(ROOT)}: @import 先が存在しない: {token}")
                continue
            if target.suffix == ".md":
                walk(target, stack + [key])

    for name in ("CLAUDE.md", "AGENTS.md"):
        p = ROOT / name
        if p.is_file():
            walk(p, [])


def check_entry_files(errors, warnings):
    claude, agents = ROOT / "CLAUDE.md", ROOT / "AGENTS.md"
    if claude.is_file():
        lines = [l.strip() for l in strip_code(claude.read_text(encoding="utf-8"))]
        n = lines.count("@AGENTS.md")
        if n == 0:
            errors.append("CLAUDE.md: 独立した行の @AGENTS.md がない")
        elif n > 1:
            errors.append(f"CLAUDE.md: @AGENTS.md が {n} 回ある（二重読み込み）")
    if agents.is_file():
        text = agents.read_text(encoding="utf-8")
        count = len(text.splitlines())
        if count > AGENTS_MAX_LINES:
            warnings.append(f"AGENTS.md が {count} 行ある（目安は {AGENTS_MAX_LINES} 行以内）")
        if imports_of(agents):
            errors.append("AGENTS.md: Claude 専用の @import を含んでいる（他のエージェントは解釈できない）")
    for name in ("CLAUDE.md", "AGENTS.md"):
        if (ROOT / ".claude" / name).exists():
            warnings.append(f"入口が重複している可能性: .claude/{name}")


def frontmatter(path):
    """先頭の --- から次の --- までを、トップレベルのキーと簡単なリストとして読む。"""
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        return None
    data, key = {}, None
    for line in lines[1:]:
        if line.strip() == "---":
            return data
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^([A-Za-z][\w-]*):\s*(.*)$", line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            data[key] = [] if val == "" else val.strip("\"'")
        elif key and re.match(r"^\s+-\s+", line) and isinstance(data.get(key), list):
            data[key].append(re.sub(r"^\s+-\s+", "", line).strip().strip("\"'"))
    return None


def check_skills_agents_rules(errors, warnings):
    for name in SKILLS:
        p = ROOT / ".claude/skills" / name / "SKILL.md"
        if not p.is_file():
            continue
        fm = frontmatter(p)
        if fm is None:
            errors.append(f"{p.relative_to(ROOT)}: frontmatter が読めない")
            continue
        if fm.get("name") != name:
            errors.append(f"{p.relative_to(ROOT)}: name がフォルダ名 {name} と違う")
        if not fm.get("description"):
            errors.append(f"{p.relative_to(ROOT)}: description がない")
        if str(fm.get("disable-model-invocation", "")).lower() != "true":
            errors.append(f"{p.relative_to(ROOT)}: disable-model-invocation: true がない")
        if "allowed-tools" in fm:
            warnings.append(f"{p.relative_to(ROOT)}: allowed-tools があり、承認を省略する")

    p = ROOT / AGENT
    if p.is_file():
        fm = frontmatter(p)
        if fm is None:
            errors.append(f"{AGENT}: frontmatter が読めない")
        else:
            for k in ("name", "description", "tools"):
                if not fm.get(k):
                    errors.append(f"{AGENT}: {k} がない")
            tools = fm.get("tools") or []
            if isinstance(tools, str):
                tools = [t.strip() for t in tools.split(",") if t.strip()]
            extra = set(tools) - AGENT_TOOLS
            if extra:
                errors.append(f"{AGENT}: 読み取り専用以外のツールがある: {', '.join(sorted(extra))}")
            if fm.get("name") and (fm["name"].startswith("-") or ":" in fm["name"]):
                errors.append(f"{AGENT}: name に使えない文字がある")

    rules = ROOT / RULES_DIR
    if rules.is_dir():
        for p in sorted(rules.glob("*.md")):
            fm = frontmatter(p)
            rel = p.relative_to(ROOT)
            if fm is None:
                warnings.append(f"{rel}: paths がなく、常に読み込まれる")
            elif not fm.get("paths"):
                warnings.append(f"{rel}: paths が空で、常に読み込まれる")
            elif not isinstance(fm["paths"], list):
                errors.append(f"{rel}: paths がリストになっていない")


def check_settings(errors, warnings):
    loaded = {}
    for rel in SETTINGS:
        p = ROOT / rel
        if not p.is_file():
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            # 中身は表示しない（秘密が含まれる可能性があるため）
            errors.append(f"{rel}: JSON の構文エラー（{e.lineno} 行 {e.colno} 列）")
            continue
        if not isinstance(data, dict):
            errors.append(f"{rel}: 最上位がオブジェクトではない")
            continue
        loaded[rel] = data

    for rel, data in loaded.items():
        perms = data.get("permissions", {})
        if isinstance(perms, dict):
            if perms.get("defaultMode") == "bypassPermissions":
                warnings.append(f"{rel}: defaultMode が bypassPermissions")
            for kind in ("allow", "ask", "deny"):
                rules = perms.get(kind, [])
                if not isinstance(rules, list):
                    errors.append(f"{rel}: permissions.{kind} がリストではない")
                    continue
                dups = sorted({r for r in rules if rules.count(r) > 1})
                if dups:
                    errors.append(f"{rel}: permissions.{kind} が重複している: {', '.join(dups)}")
                if kind == "allow" and any(r in ("Bash", "Bash(*)", "*") for r in rules):
                    warnings.append(f"{rel}: Bash などを全面的に許可している")

        hooks = data.get("hooks", {})
        if not isinstance(hooks, dict):
            errors.append(f"{rel}: hooks がオブジェクトではない")
            continue
        for event, groups in hooks.items():
            if not isinstance(groups, list):
                errors.append(f"{rel}: hooks.{event} がリストではない")
                continue
            seen = []
            for g in groups:
                for h in (g.get("hooks", []) if isinstance(g, dict) else []):
                    sig = json.dumps([g.get("matcher"), h], sort_keys=True)
                    if sig in seen:
                        errors.append(f"{rel}: hooks.{event} に同じ Hook が重複している")
                    seen.append(sig)

    marks = 0
    for data in loaded.values():
        for g in (data.get("hooks", {}) or {}).get("Stop", []) or []:
            for h in (g.get("hooks", []) if isinstance(g, dict) else []):
                if HOOK_MARK in str(h.get("command", "")):
                    marks += 1
                    t = h.get("timeout")
                    if not isinstance(t, (int, float)) or t <= 0 or t > 60:
                        errors.append("検査用 Stop Hook の timeout が 1〜60 秒になっていない")
    if marks > 1:
        errors.append(f"検査用 Stop Hook が {marks} 個登録されている")


def run_checks():
    errors, warnings = [], []
    for rel in REQUIRED:
        if not (ROOT / rel).is_file():
            errors.append(f"必須ファイルがない: {rel}")
    check_entry_files(errors, warnings)
    check_imports(errors, warnings)
    check_skills_agents_rules(errors, warnings)
    check_settings(errors, warnings)
    return errors, warnings


def hook_main():
    raw = sys.stdin.read(STDIN_LIMIT)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        print("check_ai_setup: stdin が JSON ではないので検査を省略した", file=sys.stderr)
        return 0
    if not isinstance(payload, dict) or payload.get("stop_hook_active") is True:
        return 0
    errors, _ = run_checks()
    if errors:
        reason = "AI 作業環境の設定検査で問題が見つかった。直してから終えてください:\n- " + "\n- ".join(errors)
        print(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))
    return 0


def cli_main():
    errors, warnings = run_checks()
    for e in errors:
        print(f"[失敗] {e}")
    for w in warnings:
        print(f"[注意] {w}")
    print("[未検証] YAML frontmatter は簡易的な読み取りのみで、正式な構文検証はしていない")
    print(f"結果: {'失敗' if errors else '成功'}（失敗 {len(errors)} 件、注意 {len(warnings)} 件）")
    return 1 if errors else 0


if __name__ == "__main__":
    try:
        sys.exit(hook_main() if "--hook" in sys.argv[1:] else cli_main())
    except Exception as e:  # 想定外の失敗で終了コード 2（ブロック扱い）にならないようにする
        print(f"check_ai_setup: 内部エラー: {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
