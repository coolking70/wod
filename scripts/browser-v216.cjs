require('./capture-bootstrap.cjs');
const{releaseWriter234,assertWriter234,attemptReadonly234,waitSharedSave234,resumeWriter234}=require('./save-owner-test-helpers.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require(process.env.WOD_PLAYWRIGHT_MODULE||'playwright');
const out=process.env.WOD_EVIDENCE_DIR,url=process.env.WOD_BASE_URL||'http://127.0.0.1:8002';
(async()=>{
 const {lootTransferLoop,ownedCopies}=await import('./loot-transfer-cases.mjs');
 const {setEquipmentGoal,equip,saveEquipmentSet,depart,pendingReport,claim}=await import('../dist/expedition-guild.mjs');
 const {returnLoot}=await import('../dist/expedition-loot-transfer.mjs');
 const {assignLoot}=await import('../dist/expedition-guild.mjs');
 const {CAMPAIGN_KEYS,validateCampaignBackup,captureCampaign}=await import('../dist/expedition-campaign-backup.mjs');
 const x=lootTransferLoop(),goal={heroId:'d',gearId:'clockpin'},start=setEquipmentGoal(x.start,'d','clockpin');
 const keysFor=g=>Object.fromEntries(CAMPAIGN_KEYS.map((k,i)=>[k,i===0?JSON.stringify(x.source):i===1?JSON.stringify({version:1,plans:[],bindings:{}}):i===2?null:JSON.stringify(g)]));
 const keys=keysFor(start),returned=returnLoot(start,'e','clockpin'),assigned=assignLoot(returned,'d','clockpin');
 fs.writeFileSync(path.join(out,'initial-four-keys.json'),JSON.stringify(keys));
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),rows=[],blockers=[],errors=[];let active;
 const raw=p=>p.evaluate(ks=>Object.fromEntries(ks.map(k=>[k,localStorage.getItem(k)])),CAMPAIGN_KEYS);
 const state=async p=>JSON.parse((await raw(p))[CAMPAIGN_KEYS[3]]);
 const expectedKeys=g=>({...keys,[CAMPAIGN_KEYS[3]]:JSON.stringify(g)});
 async function context(width,motion,g=start){const c=await b.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600,reducedMotion:motion});await c.addInitScript(keys=>{if(!localStorage.getItem('abbey-guild-v6'))for(const[k,v]of Object.entries(keys))if(v!==null)localStorage.setItem(k,v);},keysFor(g));return c;}
 async function open(c){const p=await c.newPage();active=p;p.on('pageerror',e=>errors.push(e.stack));await p.goto(url,{waitUntil:'networkidle'});await p.locator('header [data-view=guild]').click();return p;}
 async function focused(p,selector){const a=await p.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)));return {active:n===document.activeElement,top:r.top,bottom:r.bottom,unoccluded:hit===n||n.contains(hit),view:innerHeight};});assert.ok(a.active,selector);assert.ok(a.top>=-2&&a.top<a.view&&a.unoccluded,JSON.stringify(a));return a;}
 async function download(p,selector){const wait=p.waitForEvent('download');await p.locator(selector).click();return JSON.parse(fs.readFileSync(await(await wait).path(),'utf8'));}
 try{
  for(const width of[1440,390,320])for(const motion of['no-preference','reduce']){
   const c=await context(width,motion),p=await open(c),label=width+'-'+motion,requested=[];p.on('request',r=>requested.push(r.url()));
   assert.doesNotMatch(await p.locator('.equipment-goal').innerText(),/暂不跨人转移/);await p.locator('.equipment-goal').screenshot({path:path.join(out,'goal-'+label+'.png')});
   await p.locator('[data-guild-tab=equipment]').first().click();await p.locator('#gear-member').selectOption('b');await p.locator('#equipment-slot').selectOption('weapon');await p.locator('#gear-filter').selectOption('shop');
   await p.locator('[data-equipment-goal-owner=e]').click();assert.equal(await p.locator('#gear-member').inputValue(),'e');assert.equal(await p.locator('#gear-filter').inputValue(),'owned');assert.equal(await p.locator('#equipment-slot').inputValue(),'accessory');
   const ownerFocus=await focused(p,'[data-catalog-gear=clockpin] h3');assert.deepEqual(await raw(p),keys);assert.equal((await state(p)).command.heroId,start.command.heroId);
   await p.keyboard.press('Tab');assert.equal(await p.locator('[data-equip=clockpin]').evaluate(n=>n===document.activeElement),true);
   await p.locator('[data-loot-return=clockpin]').click();await focused(p,'.loot-return-preview h3');assert.deepEqual(await raw(p),keys);await p.keyboard.press('Tab');assert.equal(await p.locator('[data-loot-return-confirm]').evaluate(n=>n===document.activeElement),true);
   await p.locator('.loot-return-preview').screenshot({path:path.join(out,'preview-'+label+'.png')});await p.locator('[data-loot-return-cancel]').click();await focused(p,'[data-catalog-gear=clockpin] h3');assert.deepEqual(await raw(p),keys);
   await p.locator('[data-equipment-goal-open]').click();assert.equal(await p.locator('#gear-member').inputValue(),'d');await focused(p,'[data-catalog-gear=clockpin] h3');assert.deepEqual(await raw(p),keys);
   await p.locator('[data-equipment-goal-owner=e]').click();await p.locator('[data-loot-return=clockpin]').click();await p.locator('[data-loot-return-confirm]').click();assert.deepEqual(await raw(p),expectedKeys(returned));await focused(p,'[data-equipment-goal-assign]');assert.equal(ownedCopies(await state(p),'clockpin'),1);
   await p.locator('[data-equipment-goal-assign]').click();assert.deepEqual(await raw(p),expectedKeys(assigned));assert.equal(await p.locator('#gear-member').inputValue(),'d');await focused(p,'[data-catalog-gear=clockpin] h3');assert.equal(await p.locator('[data-equipment-goal-owner]').count(),0);assert.equal(await p.locator('.equipment-goal').getAttribute('data-equipment-goal-state'),'owned');assert.equal(ownedCopies(await state(p),'clockpin'),1);
   await p.locator('[data-guild-tab=history]').first().click();const backup=await download(p,'[data-campaign-export]');fs.writeFileSync(path.join(out,'assigned-campaign-'+label+'.json'),JSON.stringify(backup));fs.writeFileSync(path.join(out,'assigned-four-keys-'+label+'.json'),JSON.stringify(await raw(p))); assert.deepEqual((await validateCampaignBackup(backup)).guild,assigned);assert.deepEqual(backup,await captureCampaign({getItem:k=>expectedKeys(assigned)[k]??null},backup.payload.createdAt));
   await p.reload({waitUntil:'networkidle'});assert.deepEqual(await raw(p),expectedKeys(assigned));
   let normal=null;
   if(width===390&&motion==='no-preference'){
    await p.locator('header [data-view=adventure]').click();await p.locator('[data-adventure=inquest]').click();await p.locator('#expedition-objective').selectOption('survive');const pending=depart(assigned,x.runs[0].config);await p.locator('#guild-run').click();await p.locator('[data-guild=depart]').click();const report=await download(p,'#download');fs.writeFileSync(path.join(out,'normal62-report.json'),JSON.stringify(report));fs.writeFileSync(path.join(out,'normal62-pending-four-keys.json'),JSON.stringify(await raw(p))); assert.deepEqual(report,pendingReport(pending));assert.deepEqual(report,x.runs[0].report);assert.deepEqual(await state(p),pending);await p.locator('#report-handoff [data-report-cycle=claim]').click();assert.deepEqual(await state(p),claim(pending));fs.writeFileSync(path.join(out,'normal62-claimed-four-keys.json'),JSON.stringify(await raw(p))); assert.deepEqual((await state(p)).equipmentGoal,goal);normal={id:62,next:63,gold:(await state(p)).gold,actualAssignedGearUsed:true,wholeReportAndExplicitSingleClaimExact:true};
   }
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);assert.ok(!requested.some(s=>/assets\/studies\/.*\.(gif|png)$/.test(s)));
   rows.push({width,motion,ownerFocus,allReadOnlyNavigationPreviewAndCancelFourStringsExact:true,explicitReturnAndAssignmentFullGuildExact:true,physicalCopies:1,heroIdentityAndHistoryAndArchivesKept:true,exportAndReloadExact:true,normal});await c.close();
  }
  const worn=equip(start,'e','clockpin'),book=saveEquipmentSet(worn,'e',3,'<img src=x>'),referenced=equip(book,'e','calmribbon'),pending=depart(start,x.source);
  for(const[k,g,reason]of[['worn',worn,/穿戴/],['set',referenced,/配装栏3/],['pending',pending,/待结算/]]){
   const c=await context(390,'reduce',g),p=await open(c);assert.match(await p.locator('.equipment-goal-transfers').innerText(),reason);assert.equal(await p.locator('.equipment-goal-transfers img[src=x]').count(),0);await p.locator('[data-equipment-goal-owner=e]').click();await focused(p,'[data-catalog-gear=clockpin] h3');assert.equal(await p.locator('[data-loot-return=clockpin]').isDisabled(),true);assert.deepEqual(await raw(p),keysFor(g));blockers.push({kind:k,viewAllowed:true,returnBlocked:true,allFourStringsExact:true});await c.close();
  }
  for(const preview of[false,true]){
   const c=await context(390,'reduce'),p=await open(c);if(preview){await p.locator('[data-equipment-goal-owner=e]').click();await p.locator('[data-loot-return=clockpin]').click();}
   await releaseWriter234(p);const other=await open(c);await assertWriter234(other);await other.locator('[data-equipment-goal-owner=e]').click();await other.locator('[data-equip=clockpin]').click();const changed=await raw(other);assert.deepEqual(changed,expectedKeys(worn));await p.waitForFunction(value=>localStorage.getItem('abbey-guild-v6')===value,changed[CAMPAIGN_KEYS[3]]);if(preview)await attemptReadonly234(p,'[data-loot-return-confirm]');else await p.locator('[data-equipment-goal-owner=e]').click();await waitSharedSave234(p,other);assert.match(await p.locator('#guild-feedback').innerText(),/另一页面|公会资料已变化/);assert.deepEqual(await raw(p),changed);blockers.push({kind:preview?'stale-confirm':'stale-owner',oldActionRejected:true,allOtherPageStringsExact:true});await c.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-v216.json'),JSON.stringify({passed:true,rows,blockers,errors,sourceFixture:'existing natural loot-transfer loop, goal added by API',canonical142NeverLoaded:true,limits:'Snapshot comparisons preserve current cross-page guard; no cross-process transaction claim.'},null,2));
 }catch(e){fs.writeFileSync(path.join(out,'browser-v216.json'),JSON.stringify({passed:false,error:e.stack,rows,blockers,errors},null,2));if(active&&!active.isClosed())await active.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
