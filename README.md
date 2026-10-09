# GuShot

[![test](https://github.com/rombyar/gushot/actions/workflows/test.yml/badge.svg)](https://github.com/rombyar/gushot/actions/workflows/test.yml)

**English** · [Bahasa Indonesia](README.id.md)

GuShot (Guide User Shot) takes the screenshots for a web app's user guide. You list the pages, logins, and clicks in one JSON file, run one command, and get every image at the same size. Rerun it after a UI change instead of redoing the screenshots by hand.

It is packaged as an [Agent Skill](https://agentskills.io) in [`skills/guide-screenshots/`](skills/guide-screenshots/), so you can use it from an AI agent or on its own:

1. **Claude Code plugin**
   ```
   /plugin marketplace add rombyar/gushot
   /plugin install gushot@gushot
   ```
   Then in any project: `/guide-screenshots capture the login page and the dashboard`.
2. **Any other agent that supports Agent Skills**: copy the `skills/guide-screenshots/` folder into that agent's skills directory (see its docs). The folder is self-contained.
3. **Plain CLI**, no AI needed:
   ```bash
   npm install --omit=dev --prefix skills/guide-screenshots/scripts
   node skills/guide-screenshots/scripts/shot.cjs my-app.json            # all shots
   node skills/guide-screenshots/scripts/shot.cjs my-app.json 03 login   # only names containing "03" or "login"
   ```

Requires Node 18+ and Chrome or Edge (auto-detected, or set `"chrome"` / the `CHROME_PATH` env).

## Demo

[`demo/`](demo/) has a small orders app in one HTML file and the config that captures it. Customer names, phone numbers, and the signed-in user are blurred, and the button the guide talks about gets a red box:

![GuShot demo: login, OTP, blur, highlight, modal](demo/gushot-demo.gif)

Full-size video: [demo/gushot-demo.mp4](demo/gushot-demo.mp4). The screenshots it produces are in [demo/screenshots/](demo/screenshots/).

The config logs in, reads the OTP from a log file, and takes four shots (login, dashboard, the New order modal, and a phone-sized view). Run it yourself:

```bash
cd demo
DEMO_PASSWORD=demo node ../skills/guide-screenshots/scripts/shot.cjs gushot.json
```

## Structure

```
skills/guide-screenshots/
  SKILL.md                    instructions for AI agents
  scripts/shot.cjs            the tool (single file) + package.json
  assets/config.example.json  web app with login + OTP
  references/REFERENCE.md     every config key and step
  references/aliases-id.md    Indonesian key aliases
demo/                         sample app + config + its screenshots
test/                         self-test, no server needed
.claude-plugin/               Claude Code plugin & marketplace manifests
AGENTS.md                     pointer for coding agents working on this repo
```

## Quick look at a config

```json
{
  "base": "http://localhost:3000",
  "alwaysBlur": [".sensitive"],
  "sessions": {
    "admin": [
      { "open": "/login" },
      { "type": "input[name=email]", "text": "admin@example.com" },
      { "type": "input[name=password]", "text": "{{APP_PASSWORD}}" },
      { "click": "button[type=submit]" }
    ]
  },
  "shots": [
    { "name": "01_login_page", "url": "/login", "highlight": ["button[type=submit]"] },
    { "name": "02_dashboard", "session": "admin", "url": "/dashboard" }
  ]
}
```

Never put secrets in the JSON: `{{ENV_NAME}}` is filled from the environment (`APP_PASSWORD=secret node ...`, or `$env:APP_PASSWORD='secret'` in PowerShell).

All keys and steps: [references/REFERENCE.md](skills/guide-screenshots/references/REFERENCE.md). Full example: [assets/config.example.json](skills/guide-screenshots/assets/config.example.json).

## Languages

- Config keys are English; Indonesian keys are accepted as aliases ([aliases-id.md](skills/guide-screenshots/references/aliases-id.md)).
- Terminal messages: English by default; Indonesian with `"lang": "id"` or `SHOT_LANG=id`.
- The skill replies in the user's language.

## Self-test

```bash
node test/run.cjs
```

Runs the English and the Indonesian test config against a local HTML page. Each one has a shot that fails and a misspelled key on purpose, so the test checks those too. CI runs it on every push.

## Tips

- Use sample data (seeders), never real data. Still blur anything sensitive.
- CSS not loading: the app's base URL setting must match `base`.
- A failed shot does not stop the others.

## License

MIT
