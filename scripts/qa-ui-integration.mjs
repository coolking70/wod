import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {returningTideLoop} from './repo/scripts/returning-tide-cases.mjs';
import {CAMPAIGN_KEYS} from './repo/dist/expedition-campaign-backup.mjs';
import {pendingReport} from './repo/dist/expedition-guild.mjs';
import {phaseReplay} from './repo/dist/expedition-phase-replay.mjs';
import {replaySteps, adjacentStep} from './repo/dist/expedition-stage.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const x = returningTideLoop();
const {report, pending} = x.runs[0];
const phaseIndex = report.events.findIndex(e => e.type === 'health-phase');
assert.ok(phaseIndex > 0);
const phase = phaseReplay(report.events, {events: [report.events[phaseIndex]]});
assert.equal(phase?.event.id, 503);
assert.equal(phase.source?.id, 502);
assert.equal(phase.sourceIndex, phaseIndex - 1);
assert.equal(adjacentStep(replaySteps(report.events, true), phase.sourceIndex, 1)?.start, phaseIndex);
assert.equal(hash(report), '762d2bb354c90c08f0b6504a408383dcd417c0f7f521da84259b0528344d8112');
assert.equal(hash(pendingReport(pending)), hash(report));
const storage = Object.fromEntries(CAMPAIGN_KEYS.map((key, i) =>
  [key, [JSON.stringify(x.config), JSON.stringify({version: 1, plans: []}), null, JSON.stringify(pending)][i]]));
if (process.argv.includes('--fixture-only')) {
  console.log(JSON.stringify({fixture: 'returning-tide normal4', caseId: pending.pending.id, phase: phase.event.id,
    cause: phase.source.id, storageKeys: Object.keys(storage).length, sha256: hash(report)}));
  process.exit(0);
}

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.WOD_PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.WOD_BASE_URL || 'http://127.0.0.1:8002';
const browser = await chromium.launch({executablePath: process.env.WOD_CHROMIUM || '/usr/bin/chromium'});
const results = [], errors = [];
const selector = view => `header nav[aria-label="主导航"] [data-view="${view}"]`;
async function assertView(p, view) {
  await p.waitForFunction(v => document.body.dataset.view === v, view);
  assert.deepEqual(await p.locator('header nav[aria-label="主导航"] [aria-current]').evaluateAll(
    list => list.map(n => [n.dataset.view, n.getAttribute('aria-current'), n.classList.contains('active')])),
    [[view, 'true', true]]);
  assert.deepEqual(await p.locator('.view:not([hidden])').evaluateAll(nodes => nodes.map(n => n.id)), [view]);
}
async function assertNoOverflow(p) {
  const widths = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  assert.ok(widths[0] <= widths[1] + 2, JSON.stringify(widths));
}
const raw = p => p.evaluate(keys => Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])), CAMPAIGN_KEYS);
const phaseButton = '#phase-replay [data-phase-source]';
const pane = name => `.replay-tabs [data-replay-pane=${name}]`;
const settings = p => p.evaluate(() => Object.fromEntries(
  ['diagnostic','highlights-only','personal-playback','theatre-mode','focus-action','pause-scenes','play-speed'].map(id => {
    const control = document.getElementById(id);
    return [id, control.type === 'checkbox' ? control.checked : control.value];
  })));

try {
  for (const [width, reducedMotion] of [[320,'reduce'],[390,'no-preference']]) {
    const c = await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion});
    c.setDefaultTimeout(12000);
    await c.addInitScript(keys => {
      if (!localStorage.getItem('wod-ui-integration-seeded')) {
        for (const [k, value] of Object.entries(keys)) if (value !== null) localStorage.setItem(k,value);
        localStorage.setItem('wod-ui-integration-seeded','1');
      }
    }, storage);
    const first = await c.newPage();
    first.on('pageerror', error => errors.push(error.stack));
    await first.goto(url);
    await first.locator('body[data-save-ownership=writer]').waitFor({state:'attached'});
    await first.locator('#save-ownership summary').click();
    await first.locator('[data-save-release]').click();
    await first.locator('body[data-save-ownership=readonly]').waitFor({state:'attached'});

    const writer = await c.newPage();
    writer.on('pageerror', error => errors.push(error.stack));
    await writer.goto(url);
    await writer.locator('body[data-save-ownership=writer]').waitFor({state:'attached'});
    await assertView(first,'planning');
    await assertNoOverflow(first);
    for (const target of ['adventure','compare','guild']) {
      // Test the actual keyboard path, not synthetic DOM activation.
      const control = first.locator(selector(target));
      await control.focus();
      await first.keyboard.press('Enter');
      await assertView(first,target);
      assert.equal(await control.evaluate(n => n === document.activeElement), true);
      await assertNoOverflow(first);
    }
    await first.locator('[data-guild-tab=history]').first().click();
    await first.locator('[data-guild=report]').click();
    await first.locator('#report').waitFor();
    await assertView(first,'replay');

    const claim = first.locator('#report-handoff [data-report-cycle=claim]');
    await claim.waitFor();
    assert.equal(await claim.getAttribute('aria-disabled'),'true');
    // In Playwright, force is needed to dispatch the click to an aria-disabled button.
    await claim.click({force:true});
    assert.equal(await first.locator('#save-ownership strong').evaluate(n => n === document.activeElement),true);
    assert.deepEqual(await raw(writer),storage);

    await first.locator(pane('review')).click();
    const phaseShortcut = first.locator(`#key-events [data-key-event="${phaseIndex}"]`);
    await phaseShortcut.waitFor();
    assert.equal(await phaseShortcut.getAttribute('aria-disabled'),null);
    await phaseShortcut.press('Enter');
    await first.locator(phaseButton).waitFor();
    assert.equal(await first.locator(phaseButton).evaluate(n => n === document.activeElement),true);
    assert.match(await first.locator('#phase-replay').innerText(),/转变前[\s\S]*转变后/);
    await assertNoOverflow(first);

    await first.locator('#highlights-only').check();
    await first.locator('#personal-playback').check();
    // If the filters hide the exact record, use the unfiltered route, then check
    // the settings that are relevant there rather than silently testing a different record.
    if (!(await first.locator(phaseButton).isVisible())) {
      await first.locator(pane('review')).click();
      await phaseShortcut.click();
      await first.locator(phaseButton).waitFor();
    }
    await first.locator('#theatre-mode').check();
    await first.locator('#play-speed').selectOption('4');
    const before = await settings(first);
    assert.equal(before['highlights-only'],true);
    assert.equal(before['theatre-mode'],true);
    assert.equal(before['play-speed'],'4');
    assert.equal(await first.locator(phaseButton).getAttribute('data-phase-source'),String(phase.sourceIndex));
    await first.locator(phaseButton).click();
    assert.equal(await first.locator('#report').getAttribute('data-workspace'),'evidence');
    assert.match(await first.locator('.phase-source-record h3').innerText(),/#502$/);
    assert.equal(await first.locator('.phase-source-record').evaluate(n => n === document.activeElement),true);
    await first.locator('[data-phase-return]').press('Enter');
    assert.equal(await first.locator('#report').getAttribute('data-workspace'),'battle');
    assert.equal(await first.locator(phaseButton).evaluate(n => n === document.activeElement),true);
    assert.deepEqual(await settings(first),before);

    // Begin at the native damage group preceding the distinct phase event.
    await first.locator('#theatre-mode').uncheck();
    await first.locator('#highlights-only').uncheck();
    await first.locator('#personal-playback').uncheck();
    await first.locator('#play-speed').selectOption('1');
    for (const pause of [true,false]) {
      await first.locator(pane('evidence')).click();
      await first.locator('#diagnostic').check();
      await first.locator('#room').selectOption(String(phase.event.roomIndex));
      await first.locator(`#journal [data-event="${phase.sourceIndex}"]`).click();
      assert.equal(await first.locator(phaseButton).isVisible(),false);
      await first.locator(pane('battle')).click();
      await first.locator('#pause-scenes').setChecked(pause);
      await first.locator('#play').click();
      await first.locator(phaseButton).waitFor();
      assert.match(await first.locator('#play').innerText(),pause ? /播放/ : /暂停/);
      if (!pause) await first.locator('#play').click();
    }
    await assertView(first,'replay');
    await assertNoOverflow(first);
    assert.deepEqual(await raw(first),storage);
    assert.deepEqual(await raw(writer),storage);
    results.push({width,reducedMotion,phase:503,cause:502,mainNavigation:true,phaseReturn:true,
      optionalAutoPause:true,readOnlyStorageExact:true,noHorizontalOverflow:true});
    await c.close();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,cases:results}));
} finally { await browser.close(); }
