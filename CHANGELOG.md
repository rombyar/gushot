# Changelog

## Unreleased (1.1.0)

- Numbered highlights: `"highlight": [{ "selector": "#save", "label": "1" }]` puts a numbered badge on the top-right corner of the red box, to match "click 1, then 2" in the guide. Plain selectors still work.
- `scale` at the root sets the pixel density for every shot; `2` gives sharp images for PDF, print, and HiDPI screens. Indonesian alias: `skala`.
- `--check` runs every step without saving images, to find selectors broken by UI changes (works in CI).
- Demo uses numbered steps in `01_login` and `03_new_order`; video and GIF re-recorded.

## 1.0.0 (2026-10-09)

First public release of GuShot (Guide User Shot).

- `guide-screenshots` Agent Skill and Claude Code plugin.
- One JSON config: sessions with login and OTP from a log file, clicks, modals, blur, hide, highlight, per-shot viewport.
- English config keys with Indonesian aliases; English and Indonesian terminal messages.
- Warning for unknown config keys (likely typos).
- Self-test (`node test/run.cjs`) and CI.
- `demo/`: sample app, config, and the screenshots it produces.
