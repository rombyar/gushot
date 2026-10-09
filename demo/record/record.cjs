// Records demo/gushot-demo.mp4 and .gif: terminal -> run on demo/app.html -> results grid.
// Needs ffmpeg on PATH and the skill's dependency installed. Run the demo config first so
// demo/screenshots/ is current, then: node demo/record/record.cjs
// The scenes replay the steps of demo/gushot.json by hand; keep them in sync when the demo changes.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');
const REPO = path.resolve(__dirname, '../..');
const puppeteer = require(path.join(REPO, 'skills/guide-screenshots/scripts/node_modules/puppeteer-core'));
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'gushot-video-')); // intermediate .webm scenes
// Same browser search as findChrome() in shot.cjs (kept short here; CHROME_PATH overrides).
const CHROME = process.env.CHROME_PATH || [
  ...[process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean)
    .flatMap((d) => [path.join(d, 'Google/Chrome/Application/chrome.exe'), path.join(d, 'Microsoft/Edge/Application/msedge.exe')]),
  ...['/Applications', path.join(os.homedir(), 'Applications')]
    .map((d) => path.join(d, 'Google Chrome.app/Contents/MacOS/Google Chrome')),
  ...(process.env.PATH || '').split(path.delimiter).filter(Boolean).flatMap((d) => ['google-chrome', 'chromium', 'chrome', 'msedge']
    .map((n) => path.join(d, n + (process.platform === 'win32' ? '.exe' : '')))),
].find((p) => fs.existsSync(p));
if (!CHROME) throw new Error('Chrome/Edge not found, set CHROME_PATH');
const W = 1100, H = 640;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const url = (p) => pathToFileURL(p).href;

const CAPTION = `
  #cap{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#111827;color:#fff;
    font:600 17px system-ui,sans-serif;padding:10px 18px;border-radius:8px;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,.25)}
  #cur{position:fixed;width:18px;height:18px;border-radius:50%;background:rgba(225,29,72,.85);border:2px solid #fff;
    z-index:9998;pointer-events:none;transform:translate(-50%,-50%);transition:left .45s ease,top .45s ease;left:-40px;top:-40px}`;

async function caption(page, text) {
  await page.evaluate((css, t) => {
    if (!document.getElementById('cap')) {
      const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
      for (const id of ['cap', 'cur']) { const d = document.createElement('div'); d.id = id; document.body.appendChild(d); }
    }
    document.getElementById('cap').textContent = t;
  }, CAPTION, text);
}
async function moveTo(page, sel) {
  const b = await (await page.$(sel)).boundingBox();
  await page.evaluate((x, y) => { const c = document.getElementById('cur'); c.style.left = x + 'px'; c.style.top = y + 'px'; },
    b.x + b.width / 2, b.y + b.height / 2);
  await sleep(550);
}
async function typeIn(page, sel, text) { await moveTo(page, sel); await page.click(sel); await page.type(sel, text, { delay: 70 }); await sleep(250); }
async function clickOn(page, sel) { await moveTo(page, sel); await page.click(sel); await sleep(500); }

async function scene(browser, name, fn) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  const rec = await page.screencast({ path: path.join(OUT, name + '.webm') });
  await fn(page);
  await rec.stop();
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

  await scene(browser, '1_terminal', async (page) => {
    await page.goto(url(path.join(__dirname, 'terminal.html')));
    await page.waitForFunction('window.done === true', { timeout: 20000 });
    await sleep(1200);
  });

  await scene(browser, '2_run', async (page) => {
    await page.goto(url(path.join(REPO, 'demo/app.html')));
    await caption(page, '1 · Log in from the config');
    await sleep(700);
    await typeIn(page, '#email', 'rina@kedai.example');
    await typeIn(page, '#password', 'demo-pass');
    await clickOn(page, '#login button');
    await caption(page, '2 · OTP read from mail.log');
    await sleep(600);
    await typeIn(page, '#code', '482913');
    await clickOn(page, '#otp button');
    await sleep(900);
    await caption(page, '3 · Blur customer data');
    await sleep(600);
    await page.addStyleTag({ content: '.customer,.phone,.contact{filter:blur(6px);transition:filter .6s}' });
    await sleep(1600);
    await caption(page, '4 · Highlight the button the guide talks about');
    await moveTo(page, '#new-order');
    await page.$eval('#new-order', (e) => { e.style.outline = '3px solid #e11d48'; e.style.outlineOffset = '3px'; });
    await sleep(1800);
    await page.$eval('#new-order', (e) => { e.style.outline = ''; });
    await caption(page, '5 · Open the modal, number the steps, capture only the modal');
    await clickOn(page, '#new-order');
    await sleep(500);
    for (const [i, sel] of ['#cust', '#menu', '#qty', '.modal .primary'].entries()) {
      await page.$eval(sel, (e, n) => {
        e.style.outline = '3px solid #e11d48'; e.style.outlineOffset = '3px';
        const r = e.getBoundingClientRect();
        const b = document.createElement('div');
        b.textContent = n;
        b.style.cssText = `position:absolute;z-index:9999;left:${r.right + scrollX - 10}px;top:${r.top + scrollY - 14}px;`
          + 'min-width:24px;height:24px;border-radius:12px;background:#e11d48;color:#fff;font:700 13px/24px system-ui,sans-serif;'
          + 'text-align:center;box-shadow:0 0 0 2px #fff';
        document.body.appendChild(b);
      }, String(i + 1));
      await sleep(450);
    }
    await sleep(2000);
  });

  await scene(browser, '3_results', async (page) => {
    await page.goto(url(path.join(__dirname, 'results.html')));
    await sleep(7000); // screencast lags behind the page; leave time for the last frames
  });

  await browser.close();

  // Concatenate scenes -> mp4, then a small gif for the README.
  const list = path.join(OUT, 'list.txt');
  fs.writeFileSync(list, ['1_terminal', '2_run', '3_results'].map((n) => `file '${n}.webm'`).join('\n'));
  const mp4 = path.join(REPO, 'demo/gushot-demo.mp4');
  const gif = path.join(REPO, 'demo/gushot-demo.gif');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', mp4]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-vf',
    'fps=10,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', gif]);
  fs.rmSync(OUT, { recursive: true, force: true });
  console.log('done', mp4, gif);
})().catch((e) => { console.error(e); process.exit(1); });
