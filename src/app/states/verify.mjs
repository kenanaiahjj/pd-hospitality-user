import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire('/Users/kenanaiahjolmfc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');
const base = process.env.STATES_URL ?? 'http://localhost:3000';
await mkdir('reports/states', { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
let activePreset = 'workbench';
const runtimeErrors=[];
page.on('pageerror',error=>runtimeErrors.push({preset:activePreset,message:error.message}));
const report = { at: new Date().toISOString(), base, checked: [], errors: [] };
try {
  await page.goto(`${base}/states`);
  await page.getByRole('heading', { name: 'Component states', exact: true }).waitFor({ timeout: 30000 });
  const presets = await page.locator('script#states-manifest').textContent();
  const catalog = JSON.parse(presets);
  for (const component of catalog) {
    for (const state of component.states) {
      activePreset = `${component.id}/${state.id}`;
      const beforeErrors=runtimeErrors.length;
      const url = `${base}/states/preview?__component=${encodeURIComponent(component.id)}&__state=${encodeURIComponent(state.id)}`;
      await page.goto(url);
      await page.locator(`[data-preview-ready][data-component="${component.id}"][data-preset="${state.id}"]`).waitFor({ timeout: 30000 });
      await page.waitForTimeout(100);
      const error = await page.locator('[data-preview-error]').count();
      assert.equal(error, 0, `${component.id}/${state.id} render failure`);
      if(component.id==='booking-card'&&!['extra-charge','damage-claim','refund-failed','pms-pending'].includes(state.id))assert.equal(await page.locator('[data-engine-state]').getAttribute('data-engine-state'),state.id);
      assert.ok((await page.locator('[data-preview-ready]').innerHTML()).length > 20);
      assert.equal(runtimeErrors.length,beforeErrors,JSON.stringify(runtimeErrors.slice(beforeErrors)));
      report.checked.push({ component: component.id, state: state.id });
    }
  }
  await page.goto(`${base}/states?__component=booking-card&__state=requested`);
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: 'Vendor confirms', exact: true }).click();
  await frame.locator('[data-engine-state="confirmed"]').waitFor();
  await page.waitForFunction(() => new URL(location.href).searchParams.get('__state') === 'confirmed');
  await page.screenshot({ path: 'reports/states/desktop.png', fullPage: true });
  await page.reload();
  await frame.locator('[data-engine-state="confirmed"]').waitFor();
  await page.keyboard.press('h');
  await page.locator('[data-workbench-hidden="true"]').waitFor();
  await page.keyboard.press('h');
  await page.goto(`${base}/states?__component=notice&__state=warning`);
  await frame.getByText('Please try again').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'reports/states/mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto(`${base}/states?__component=missing&__state=missing`);
  await page.locator('iframe').waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('cabana.guest-session.v5')), null);
  assert.equal(runtimeErrors.length,0,JSON.stringify(runtimeErrors));
  report.passed = true;
  report.runtimeErrors=runtimeErrors;
} catch (error) {
  report.passed = false;
  report.errors.push(String(error));
  process.exitCode = 1;
} finally {
  await writeFile('reports/states/results.json', JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify({ passed: report.passed, presets: report.checked.length, errors: report.errors }));
}
