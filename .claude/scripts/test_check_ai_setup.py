#!/usr/bin/env python3
"""check_ai_setup.py の単体テスト。本物の設定は変えず、一時フォルダの写しだけを使う。

使い方: python3 .claude/scripts/test_check_ai_setup.py
"""
import json
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path

REAL_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_REL = ".claude/scripts/check_ai_setup.py"
MANAGED = [
    "AGENTS.md", "CLAUDE.md",
    "docs/ai/context.md", "docs/ai/checks.md", "docs/ai/setup-report.md",
    "tasks/active.md", "tasks/handoff.md",
    ".claude/settings.json", ".claude/skills/project-work/SKILL.md",
    ".claude/skills/project-check/SKILL.md", ".claude/agents/project-reviewer.md",
    ".claude/rules/shuten-doji-prototype.md", ".claude/rules/single-file-html.md",
    ".claude/rules/japanese-writing.md", SCRIPT_REL,
]
HOOK_TIMEOUT = 15
STOP_INPUT = {"session_id": "test", "hook_event_name": "Stop", "stop_hook_active": False,
              "cwd": "/tmp", "last_assistant_message": "done"}


class CheckTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="ai-setup-test-"))
        for rel in MANAGED:
            dst = self.tmp / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(REAL_ROOT / rel, dst)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def run_script(self, *args, stdin=""):
        return subprocess.run([sys.executable, str(self.tmp / SCRIPT_REL), *args],
                              input=stdin, capture_output=True, text=True, timeout=HOOK_TIMEOUT)

    def hook(self, payload=None, raw=None):
        return self.run_script("--hook", stdin=raw if raw is not None else json.dumps(payload or STOP_INPUT))

    def write(self, rel, text):
        p = self.tmp / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")

    def assert_blocked(self, r, needle):
        self.assertEqual(r.returncode, 0, r.stderr)
        out = json.loads(r.stdout)
        self.assertEqual(out["decision"], "block")
        self.assertIn(needle, out["reason"])

    # 正常
    def test_cli_ok(self):
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("結果: 成功", r.stdout)

    def test_hook_ok_is_silent(self):
        r = self.hook()
        self.assertEqual((r.returncode, r.stdout), (0, ""), r.stderr)

    # 異常
    def test_broken_json_blocks(self):
        self.write(".claude/settings.json", '{"permissions": ')
        self.assert_blocked(self.hook(), "JSON の構文エラー")

    def test_missing_file_blocks(self):
        (self.tmp / "tasks/handoff.md").unlink()
        self.assert_blocked(self.hook(), "tasks/handoff.md")

    def test_missing_import_blocks(self):
        self.write("CLAUDE.md", "@AGENTS.md\n@docs/ai/nai.md\n")
        self.assert_blocked(self.hook(), "@import 先が存在しない")

    def test_import_cycle_blocks(self):
        self.write("CLAUDE.md", "@AGENTS.md\n@docs/a.md\n")
        self.write("docs/a.md", "@b.md\n")
        self.write("docs/b.md", "@a.md\n")
        self.assert_blocked(self.hook(), "循環")

    def test_double_import_blocks(self):
        self.write("CLAUDE.md", "@AGENTS.md\n\n@AGENTS.md\n")
        self.assert_blocked(self.hook(), "2 回")

    def test_import_in_code_is_ignored(self):
        self.write("CLAUDE.md", "@AGENTS.md\n\n```\n@nai.md\n```\n`@nai2.md`\n")
        self.assertEqual(self.hook().stdout, "")

    def test_agent_with_bash_blocks(self):
        p = self.tmp / ".claude/agents/project-reviewer.md"
        p.write_text(p.read_text(encoding="utf-8").replace("tools: Read, Grep, Glob", "tools: Read, Bash"),
                     encoding="utf-8")
        self.assert_blocked(self.hook(), "Bash")

    def test_skill_without_disable_blocks(self):
        p = self.tmp / ".claude/skills/project-work/SKILL.md"
        p.write_text(p.read_text(encoding="utf-8").replace("disable-model-invocation: true\n", ""),
                     encoding="utf-8")
        self.assert_blocked(self.hook(), "disable-model-invocation")

    def test_duplicate_hook_blocks(self):
        s = json.loads((self.tmp / ".claude/settings.json").read_text(encoding="utf-8"))
        h = {"type": "command", "command": "python3 x/check_ai_setup.py --hook", "timeout": 15}
        s["hooks"] = {"Stop": [{"hooks": [h]}, {"hooks": [h]}]}
        self.write(".claude/settings.json", json.dumps(s))
        self.assert_blocked(self.hook(), "重複")

    def test_cli_fails_with_exit_1(self):
        self.write(".claude/settings.json", "[")
        r = self.run_script()
        self.assertEqual(r.returncode, 1)
        self.assertIn("[失敗]", r.stdout)

    # 再ブロックの防止と、入力の異常
    def test_stop_hook_active_never_blocks(self):
        self.write(".claude/settings.json", "{")
        r = self.hook(dict(STOP_INPUT, stop_hook_active=True))
        self.assertEqual((r.returncode, r.stdout), (0, ""))

    def test_invalid_stdin_does_not_block(self):
        self.write(".claude/settings.json", "{")
        for raw in ("", "not json", "[1,2]"):
            r = self.hook(raw=raw)
            self.assertEqual((r.returncode, r.stdout), (0, ""), raw)

    def test_never_exits_2(self):
        (self.tmp / "AGENTS.md").write_bytes(b"\xff\xfe broken")
        r = self.hook()
        self.assertNotEqual(r.returncode, 2)

    # 時間制限
    def test_runs_well_within_timeout(self):
        start = time.monotonic()
        self.hook()
        self.assertLess(time.monotonic() - start, HOOK_TIMEOUT / 3)

    def test_real_hook_timeout_is_bounded(self):
        s = json.loads((REAL_ROOT / ".claude/settings.json").read_text(encoding="utf-8"))
        hooks = [h for g in s.get("hooks", {}).get("Stop", []) for h in g.get("hooks", [])
                 if "check_ai_setup.py" in h.get("command", "")]
        if not hooks:
            self.skipTest("Hook はまだ登録されていない")
        self.assertEqual(len(hooks), 1)
        self.assertTrue(0 < hooks[0]["timeout"] <= 60)

    def test_hook_does_not_modify_files(self):
        before = {p: p.read_bytes() for p in self.tmp.rglob("*") if p.is_file()}
        self.hook()
        after = {p: p.read_bytes() for p in self.tmp.rglob("*") if p.is_file() and "__pycache__" not in p.parts}
        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main(verbosity=2)
