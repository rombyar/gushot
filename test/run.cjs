// Self-test: runs both test configs and checks the expected result
// (3 OK, 1 deliberate failure -> exit 1, plus a warning for the deliberate typo key).
// Exits 0 when everything matches. Usage: node test/run.cjs
const { spawnSync } = require('child_process');
const path = require('path');

const cases = [
  ['config.test.json', 'Done: 3 OK, 1 failed', 'unknown key "higlight"'],
  ['config.test.id.json', 'Selesai: 3 OK, 1 gagal', 'key "sorrot" tidak dikenal'],
];
let bad = 0;
for (const [config, summary, warning] of cases) {
  const r = spawnSync(process.execPath, [path.join(__dirname, '../skills/guide-screenshots/scripts/shot.cjs'), config], {
    cwd: __dirname, encoding: 'utf8', env: { ...process.env, TEST_PASSWORD: 'x' },
  });
  const out = r.stdout + r.stderr;
  const ok = r.status === 1 && out.includes(summary) && out.includes(warning);
  console.log(ok ? 'PASS' : 'FAIL', config);
  if (!ok) { bad++; console.log(out); }
}
process.exit(bad ? 1 : 0);
