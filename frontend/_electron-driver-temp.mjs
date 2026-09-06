// One-shot Electron launcher/screenshotter for verification.
// This shell has ELECTRON_RUN_AS_NODE=1 set globally (sandbox measure that stops
// Electron GUI apps from popping up when spawned directly), which is why
// `npm run electron:dev` crashed with `ipcMain` undefined earlier. Playwright's
// _electron.launch() spawns its own child process, so we explicitly clear that var
// for the child only — the parent shell's env is untouched.
// TEMPORARY FILE — not part of the app, delete after use.
import { _electron as electron } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const APP_DIR = process.cwd();
const SHOT_DIR = process.env.SCREENSHOT_DIR || 'C:/Users/sebas/AppData/Local/Temp/claude/c--Content-Projects-Sistema-Escolar-Milagroso-San-Judas-Tadeo-SistemaEscolar/05c38bcd-3bc1-474f-b99e-ce68b075c9ef/scratchpad/shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/electron.exe');

const run = async () => {
  console.log('launching electron from', APP_DIR, 'bin:', electronBin);
  // A key set to '' is still "present" to a C getenv() check, so Electron still
  // treats it as run-as-node. Must actually delete the key, not blank it.
  const childEnv = { ...process.env, NODE_ENV: 'development' };
  delete childEnv.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({
    executablePath: electronBin,
    args: ['.'],
    cwd: APP_DIR,
    env: childEnv,
    timeout: 30_000,
  });

  console.log('launched. waiting for window...');
  await new Promise((r) => setTimeout(r, 8_000));

  console.log('windows:', app.windows().map((w) => w.url()));
  const page = app.windows().find((w) => !w.url().startsWith('devtools://')) ?? (await app.firstWindow());

  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));

  const shot1 = path.join(SHOT_DIR, '01-inicial.png');
  await page.screenshot({ path: shot1 });
  console.log('screenshot:', shot1);
  console.log('title:', await page.title());
  console.log('url:', page.url());

  await app.close();
  console.log('closed.');
};

run().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
