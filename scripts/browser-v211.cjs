require('./capture-bootstrap.cjs');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require(process.env.WOD_PLAYWRIGHT_MODULE || 'playwright');
const out = process.env.WOD_EVIDENCE_DIR, url = process.env.WOD_BASE_URL || 'http://127.0.0.1:8002';
(async () => {
 const {actionOutcomeLoop} = await import('./action-outcome-cases.mjs');
 const {CAMPAIGN_KEYS, captureCampaign, validateCampaignBackup} = await import('../dist/expedition-campaign-backup.mjs');
 const {reviewReport} = await import('../dist/expedition-review.mjs');
 const {claim} = await import('../dist/expedition-guild.mjs');
 const run = actionOutcomeLoop().runs[0], keys = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/v151-preparation-state.json')));
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium', args:['--no-sandbox']});
 const rows = [], errors = []; let active;
 const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
 const raw = p => p.evaluate(ks => Object.fromEntries(ks.map(k => [k, localStorage.getItem(k)])), CAMPAIGN_KEYS);
 const enter = async n => {await n.focus(); assert.equal(await n.evaluate(n => n===document.activeElement),true,'Activation target must actually receive keyboard focus'); await n.press('Enter');};
 async function download(p, selector = '#download') {
  const wait = p.waitForEvent('download'); await p.locator(selector).click();
  return JSON.parse(fs.readFileSync(await (await wait).path()));
 }
 async function focusProof(p, target) {
  await settle(p);
  const detail = p.locator('#detail');
  assert.equal(await p.locator('#report').getAttribute('data-workspace'), 'evidence');
  const measurement = await detail.evaluate(n => {
   const box = n.getBoundingClientRect(), bar = document.querySelector('.replay-controls').getBoundingClientRect();
   const hit = document.elementFromPoint(box.left + Math.min(40, box.width / 2), box.top + 14);
   return {top:box.top, bottom:box.bottom, controlsBottom:bar.bottom, focused:document.activeElement === n, unobscured:hit === n || n.contains(hit)};
  });
  assert.ok(measurement.focused && measurement.unobscured && measurement.top >= measurement.controlsBottom && measurement.top - measurement.controlsBottom <= 32 && measurement.top < 844, JSON.stringify(measurement));
  assert.ok((await detail.innerText()).includes(target.text));
  assert.equal(await p.locator('#play').innerText(), '▶ 播放');
  assert.equal(await p.locator('#board, #action-focus').evaluateAll(ns => ns.reduce((s,n) => s+n.getAnimations({subtree:true}).length,0)), 0);
  return measurement;
 }
 try {
  for (const width of [1440,390,320]) for (const motion of ['no-preference','reduce']) {
   const context = await browser.newContext({viewport:{width,height:844}, reducedMotion:motion, isMobile:width < 600, hasTouch:width < 600});
   await context.addInitScript(keys => {
    if (!sessionStorage.getItem('review211-seeded')) {
     for (const [k,v] of Object.entries(keys)) if (v !== null) localStorage.setItem(k,v);
     sessionStorage.setItem('review211-seeded','1');
    }
   }, keys);
   const p = await context.newPage(); active = p; p.on('pageerror', e => errors.push(e.stack));
   const requests = []; p.on('request', r => requests.push(r.url()));
   await p.goto(url,{waitUntil:'networkidle'});
   assert.deepEqual(await raw(p),keys);
   await p.locator('header [data-view=planning]').click();
   const preparation = path.join(out, 'preparation-'+width+'-'+motion+'.json');
   fs.writeFileSync(preparation, JSON.stringify(run.preparation));
   await p.locator('#file').setInputFiles(preparation);
   await p.waitForFunction(c => localStorage.getItem('abbey-expedition-v40') === JSON.stringify(c),run.preparation);
   await p.locator('#guild-run').click(); await p.locator('[data-guild=depart]').click();
   assert.deepEqual(await download(p),run.report);
   const held = await raw(p); assert.deepEqual(JSON.parse(held[CAMPAIGN_KEYS[3]]),run.pending);
   const ward = run.report.events.find(e => e.type === 'effect' && e.detail.skill === 'ward') || run.report.events.find(e => e.type === 'attack');
   await p.locator('#play').click(); await enter(p.locator('[data-journey-evidence]'));
   const firstProof = await focusProof(p,ward);
   assert.deepEqual(await raw(p),held);
   await p.screenshot({path:path.join(out,'proof-'+width+'-'+motion+'.png')});

   const room = reviewReport(run.report).find(r => r.findings.some(f => f.hero));
   assert.ok(room); const finding = room.findings.find(f => f.hero);
   await p.locator('.replay-tabs [data-replay-pane=review]').click();
   const panel=p.locator('.review-panel'); if(!await panel.evaluate(n=>n.open))await panel.locator('summary').first().click();
   const observation = p.locator('#review-rooms .review-room').nth(room.roomIndex);
   if (!await observation.evaluate(n => n.open)) await observation.locator('summary').click();
   const evidence = observation.locator('[data-evidence="'+finding.eventIndex+'"]').first();
   await enter(evidence);
   const reviewProof = await focusProof(p,run.report.events[finding.eventIndex]);
   assert.equal(await p.locator('#diagnostic').isChecked(),true);
   assert.deepEqual(await raw(p),held);

   await p.locator('.replay-tabs [data-replay-pane=review]').click();
   const ledger = p.locator('#foundry-outcome [data-ledger-source]').first();
   let ledgerProof = null;
   assert.equal(await ledger.count(),1);
   if (await ledger.count()) {
    for(const ancestor of await ledger.locator('xpath=ancestor::details').all())if(!await ancestor.evaluate(n=>n.open))await ancestor.locator('summary').first().click();
    const id = Number(await ledger.getAttribute('data-ledger-source'));
    await enter(ledger); ledgerProof = await focusProof(p,run.report.events.find(e => e.id === id));
    assert.deepEqual(await raw(p),held);
    await p.locator('.replay-tabs [data-replay-pane=review]').click();
   }
   await enter(observation.locator('[data-review-edit="'+finding.roomId+':'+finding.hero+'"]').first());
   const prepared = await raw(p);
   assert.deepEqual(JSON.parse(prepared[CAMPAIGN_KEYS[0]]),run.report.config);
   for (const key of CAMPAIGN_KEYS.slice(1)) assert.equal(prepared[key],held[key]);
   assert.equal(await p.locator('#editor').getAttribute('data-editor-hero'),finding.hero);
   assert.equal(await p.locator('#editor').getAttribute('data-editor-room'),finding.roomId);
   const nav = p.locator('#editor-navigation');
   const editorFocus = await nav.evaluate(n => {
    const r=n.getBoundingClientRect(),tabs=document.querySelector('.prep-tabs'),b=tabs.getBoundingClientRect();
    const hit=document.elementFromPoint(r.left+20,r.top+12);
    return {top:r.top,tabsBottom:b.bottom,focused:document.activeElement===n,unobscured:hit===n||n.contains(hit)};
   });
   assert.ok(editorFocus.focused && editorFocus.unobscured && editorFocus.top>=0 && editorFocus.top<844,JSON.stringify(editorFocus));
   await enter(nav.locator('[data-editor-jump=main]'));
   const field = p.locator('#editor select[data-phase=main][data-row="0"][data-field=mode]'), old = await field.inputValue();
   assert.notEqual(old,'once');
   await field.focus(); await p.keyboard.press('End'); assert.equal(await field.evaluate(n => n===document.activeElement),true);
   assert.equal(await field.inputValue(),'once');
   const expectedEdit=structuredClone(run.report.config),hero=expectedEdit.heroes.find(h=>h.id===finding.hero);
   hero.overrides??={};hero.overrides[finding.roomId]??={};
   hero.overrides[finding.roomId].main=structuredClone(hero.overrides[finding.roomId].main||hero.main);
   hero.overrides[finding.roomId].main[0].mode='once';
   const edited=await raw(p);assert.deepEqual(JSON.parse(edited[CAMPAIGN_KEYS[0]]),expectedEdit);
   for(const k of CAMPAIGN_KEYS.slice(1))assert.equal(edited[k],held[k]);
   await enter(p.locator('#editor-main-heading + .editor-back')); await enter(nav.locator('[data-editor-review]'));
   assert.equal(await p.locator('[data-guild=depart]').isDisabled(),true);
   assert.deepEqual(await raw(p),edited);
   await p.locator('header [data-view=planning]').click();await p.locator('.prep-tabs [data-prep=plans]').click();
   await p.locator('#undo-load').click();assert.deepEqual(await raw(p),held);
   await p.locator('header [data-view=replay]').click(); assert.deepEqual(await download(p),run.report);
   assert.equal(await p.locator('[data-journey-evidence] img').evaluate(n => n.complete && n.naturalWidth>0),true);
   const exported = await captureCampaign({getItem:k=>held[k]??null},'2026-11-09T00:00:00.000Z');
   assert.deepEqual((await validateCampaignBackup(exported)).guild,run.pending);
   fs.writeFileSync(path.join(out,'pending-campaign-'+width+'-'+motion+'.json'),JSON.stringify(exported,null,2));
   if(width===390 && motion==='reduce') {
    await p.locator('#report-handoff [data-report-cycle=claim]').click();
    assert.deepEqual(JSON.parse((await raw(p))[CAMPAIGN_KEYS[3]]),claim(run.pending));
   }
   const final = await raw(p); await p.reload({waitUntil:'networkidle'}); assert.deepEqual(await raw(p),final);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   assert.ok(!requests.some(u=>u.includes('review-compass-v211') && /\.(gif|png)/.test(u)));
   rows.push({width,motion,firstProof,reviewProof,ledgerProof,editorFocus,realOrdinaryId:run.pending.pending.id,
    wholeReportAndFourStringsExactUntilExplicitDraftLoad:true,draftOnlyChangedByExplicitReviewEdit:true,
    comparisonAPlanBookAndGuildUnchangedByEditing:true,explicitRoomEditAndUndoRestoresAllFourOriginalStrings:true,exactHeroAndRoomFocused:true,originalPendingPreventsDuplicateDeparture:true,
    backupAndReloadExact:true,oneExplicitClaimOnly:width===390&&motion==='reduce'});
   await context.close();
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'browser-v211.json'),JSON.stringify({passed:true,rows,errors,noCanonical142DepartureOrClaim:true},null,2));
  console.log(JSON.stringify({passed:true,contexts:rows.length,proofs:rows.reduce((n,r)=>n+2+Number(Boolean(r.ledgerProof)),0)}));
 } catch(error) {
  fs.writeFileSync(path.join(out,'browser-v211.json'),JSON.stringify({passed:false,error:error.stack,rows,errors},null,2));
  if(active&&!active.isClosed())await active.screenshot({path:path.join(out,'failure.png')});
  throw error;
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
