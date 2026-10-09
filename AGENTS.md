# AGENTS.md

This repo is one Agent Skill: `skills/guide-screenshots/` (see its `SKILL.md`). To capture user-guide screenshots, follow that skill. Do not write a new browser-automation script.

Working on the tool itself:

- Code: `skills/guide-screenshots/scripts/shot.cjs` (single file, CommonJS, only dependency `puppeteer-core`).
- Keep the skill folder self-contained: anything the skill needs lives inside it, paths in `SKILL.md` stay relative to the skill folder, no agent-specific variables.
- Config keys are English; Indonesian aliases live in the `ALIAS` map. When adding a key, update `KEYS`, `ALIAS`, `references/REFERENCE.md`, and `references/aliases-id.md`.
- Terminal messages live in `MSG.en` and `MSG.id`; add both.
- Self-test after changes (CI runs the same; exit 0 = pass):
  ```bash
  node test/run.cjs
  ```
- Add user-visible changes to `CHANGELOG.md`; keep the version in `SKILL.md`, `scripts/package.json`, and `.claude-plugin/plugin.json` in sync.
