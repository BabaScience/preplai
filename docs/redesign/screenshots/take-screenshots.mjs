/**
 * Real browser screenshots for Phase 1 player redesign review.
 * Run: node docs/redesign/screenshots/take-screenshots.mjs
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // ── 1. Frame nav visibility (MCP player — cinema theme) ──────────────
  // The fix: opacity 0 → 0.4 on auto-hidden. Previously invisible on idle.
  await page.goto('http://localhost:8989/dist/mcp-app.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  // Verify fix
  const frameNavOpacity = await page.evaluate(() => {
    const nav = document.getElementById('frame-nav');
    return { opacity: window.getComputedStyle(nav).opacity, classes: nav.className };
  });
  console.log('frame-nav:', frameNavOpacity);
  await page.screenshot({ path: path.join(__dirname, '01-frame-nav-opacity-0.4.png') });
  console.log('✓ 01-frame-nav-opacity-0.4.png');

  // ── 2. Landing page hero player (light theme) — narrator + player ──
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  // Scroll to hero player
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(__dirname, '02-hero-player-light-theme.png') });
  console.log('✓ 02-hero-player-light-theme.png');

  // ── 3. Narrator area (scroll to show it with text) ──────────────────
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(1000);
  const narratorEl = await page.$('#narrator-text, .narrator-text');
  if (narratorEl) {
    await narratorEl.screenshot({ path: path.join(__dirname, '03-narrator-8em-height.png') });
    console.log('✓ 03-narrator-8em-height.png');
  }
  // Full viewport with narrator visible
  await page.screenshot({ path: path.join(__dirname, '03-narrator-full-view.png') });
  console.log('✓ 03-narrator-full-view.png');

  // ── 4. Entity Debug — Cinema theme — Server entity ───────────────────
  await page.goto('http://localhost:5173/dev/illustrations', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  // Click Cinema theme button
  const cinemaBtn = await page.$('button:has-text("Cinema"), [data-theme="cinema"]');
  if (cinemaBtn) {
    await cinemaBtn.click();
    await page.waitForTimeout(500);
  }
  // Click on Server entity in list
  const serverItem = await page.$('text=Server');
  if (serverItem) {
    await serverItem.click();
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: path.join(__dirname, '04-entity-cinema-server.png') });
  console.log('✓ 04-entity-cinema-server.png');

  // ── 5. Cinema theme — multiple entity types ──────────────────────────
  const dbItem = await page.$('text=Database');
  if (dbItem) {
    await dbItem.click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(__dirname, '05-entity-cinema-multiple.png') });
  console.log('✓ 05-entity-cinema-multiple.png');

  await browser.close();
  console.log('\n✅ All screenshots saved to docs/redesign/screenshots/');
}

run().catch(console.error);
