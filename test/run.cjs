// Self-test: runs the test configs and checks the expected result
// (3 OK, 1 deliberate failure -> exit 1, plus a warning for the deliberate typo key).
// Exits 0 when everything matches. Usage: node test/run.cjs
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const shot = (...args) => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '../skills/guide-screenshots/scripts/shot.cjs'), ...args], {
    cwd: __dirname, encoding: 'utf8', env: { ...process.env, TEST_PASSWORD: 'x' },
  });
  return { status: r.status, out: r.stdout + r.stderr };
};
// PNG width is a big-endian uint32 at byte 16.
const pngWidth = (f) => fs.readFileSync(path.join(__dirname, 'output', f)).readUInt32BE(16);

const cases = [
  ['English keys, numbered highlight', () => {
    const r = shot('config.test.json');
    return r.status === 1 && r.out.includes('Done: 3 OK, 1 failed') && r.out.includes('unknown key "higlight"') || r.out;
  }],
  ['Indonesian keys, scale 2', () => {
    const r = shot('config.test.id.json');
    return r.status === 1 && r.out.includes('Selesai: 3 OK, 1 gagal') && r.out.includes('key "sorrot" tidak dikenal')
      && pngWidth('u01_setelah_login.png') === 2560 || r.out;
  }],
  ['--check saves nothing', () => {
    const f = path.join(__dirname, 'output', 't02_modal.png');
    fs.rmSync(f, { force: true });
    const r = shot('config.test.json', 't02', '--check');
    return r.status === 0 && r.out.includes('t02_modal (checked, not saved)') && !fs.existsSync(f) || r.out;
  }],
];
let bad = 0;
for (const [name, run] of cases) {
  const res = run();
  console.log(res === true ? 'PASS' : 'FAIL', name);
  if (res !== true) { bad++; console.log(res); }
}
process.exit(bad ? 1 : 0);
