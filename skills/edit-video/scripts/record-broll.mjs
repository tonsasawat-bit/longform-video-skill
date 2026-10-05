#!/usr/bin/env node
// Record real public web pages as moving B-roll (headless Chrome, 1920x1080) for long-form edits.
// Usage: node .claude/skills/edit-video/scripts/record-broll.mjs <project>/assets/broll/shots.json [id ...]
// shots.json: [{ "id": "openclaw-repo", "url": "https://github.com/openclaw/openclaw",
//               "act": [["wait", 1.5], ["scroll", 600, 6]] }, ...]
//   act steps: ["wait", s] | ["scroll", px, s] (eased) | ["goto", url] (use url "about:blank" to show a redirect live)
// Writes <id>.mp4 (H.264, 30fps, starts after load + cookie banner) and footage-ledger.json next to shots.json.
// Never signs in, types, or submits anything. Cookie banners get the most privacy-preserving choice.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [shotsFile, ...want] = process.argv.slice(2);
if (!shotsFile) { console.error('usage: record-broll.mjs <shots.json> [id ...]'); process.exit(2); }
const DIR = path.dirname(path.resolve(shotsFile));
const RAW = path.join(DIR, 'raw');
fs.mkdirSync(RAW, { recursive: true });
const SHOTS = JSON.parse(fs.readFileSync(shotsFile, 'utf8'));

const REJECT = [/decline optional/i, /only allow essential/i, /allow essential cookies only/i, /reject non-essential/i,
  /reject all/i, /decline/i, /only necessary/i, /necessary cookies only/i, /ปฏิเสธ/];
async function declineCookies(page) {
  for (const re of REJECT) {
    const b = page.getByRole('button', { name: re }).first();
    if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await page.waitForTimeout(400); return true; }
  }
  return false;
}
async function easedScroll(page, px, secs) {
  await page.evaluate(async ([px, ms]) => {
    const y0 = window.scrollY, t0 = performance.now();
    await new Promise(res => {
      const step = now => {
        const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        window.scrollTo(0, y0 + px * e); k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
  }, [px, secs * 1000]);
}

// Real Chrome channel + no automation flag + real UA: gets past Cloudflare on openai.com, chatgpt.com, x.ai.
const ARGS = ['--disable-blink-features=AutomationControlled'];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ARGS })
  .catch(e => { console.log('chrome channel unavailable, using bundled chromium:', e.message.split('\n')[0]); return chromium.launch({ headless: true, args: ARGS }); });
const ledgerPath = path.join(DIR, 'footage-ledger.json');
const ledger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : {};
let failed = 0;
for (const s of SHOTS.filter(s => !want.length || want.includes(s.id))) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'en-US', userAgent: UA,
    recordVideo: { dir: RAW, size: { width: 1920, height: 1080 } }, colorScheme: 'light' });
  const page = await ctx.newPage();
  const t0 = Date.now();
  let status = null;
  try {
    if (s.url !== 'about:blank') {
      const r = await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 30000 }); status = r?.status();
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await declineCookies(page); await page.waitForTimeout(800); await declineCookies(page);
    }
    const tStart = (Date.now() - t0) / 1000;   // clean footage starts here (after load + banner)
    for (const [k, a, b] of s.act || [['wait', 1.5], ['scroll', 600, 5]]) {
      if (k === 'wait') await page.waitForTimeout(a * 1000);
      if (k === 'scroll') await easedScroll(page, a, b);
      if (k === 'goto') {
        const r = await page.goto(a, { waitUntil: 'domcontentloaded', timeout: 30000 }); status = r?.status();
        for (let i = 0; i < 6; i++) { await page.waitForTimeout(400); if (await declineCookies(page)) break; }  // late banners
      }
    }
    await page.waitForTimeout(600);
    const finalUrl = page.url(), title = await page.title();
    const vid = page.video(); await ctx.close();
    const webm = await vid.path();
    const mp4 = path.join(DIR, `${s.id}.mp4`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(Math.max(0, tStart - 0.2)), '-i', webm, '-r', '30',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', mp4]);
    const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString());
    const sha = createHash('sha256').update(fs.readFileSync(mp4)).digest('hex');
    ledger[s.id] = { url: s.url, finalUrl, title, status, capturedAt: new Date().toISOString(), file: `${s.id}.mp4`, duration: +dur.toFixed(2), sha256: sha };
    // A 403 or "Just a moment…" / "Attention Required" title means a bot wall was recorded, not the page.
    const blocked = status >= 400 || /just a moment|attention required/i.test(title);
    if (blocked) failed++;
    console.log(blocked ? 'BLOCKED' : 'ok', s.id, status, finalUrl, JSON.stringify(title), dur.toFixed(1) + 's');
  } catch (e) {
    failed++; console.log('FAIL', s.id, e.message.split('\n')[0]); await ctx.close().catch(() => {});
  }
}
await browser.close();
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 1));
process.exit(failed ? 1 : 0);
