const {chromium}=require(process.env.WOD_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.WOD_EVIDENCE_DIR||'/tmp/wod-browser-v56',url=process.env.WOD_BASE_URL||'http://127.0.0.1:8000',backup=process.env.WOD_EARNED_GUILD||'/workspace/wod-evidence/v56/earned-guild.json';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.WOD_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],steps=[];
 const watch=p=>{p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status());});};watch(page);
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('abbey-guild-v6'))),member=(g,id)=>g.members.find(m=>m.id===id);
 const team=async id=>{await page.locator('.guild-tabs [data-guild-tab="team"]').click();await page.locator(`[data-member="${id}"]`).click();};
 const openCareer=()=>page.locator('.advancement-card>summary').click();
 const exported=async()=>{const w=page.waitForEvent('download');await page.locator('#download').click();return JSON.parse(fs.readFileSync(await(await w).path(),'utf8'));};
 const show=async e=>{await page.locator('.replay-tabs [data-replay-pane="evidence"]').click();await page.locator('#diagnostic').check();await page.locator('#room').selectOption(String(e.roomIndex));await page.locator(`#journal [data-event="${report.events.indexOf(e)}"]`).click();};
 let report;
 try{
  await page.goto(url);await page.locator('[data-own-hero="c"]').click();await team('d');await openCareer();assert.equal(await page.locator('[data-advancement="sigilcraft"]').isDisabled(),true);assert.match(await page.locator('.advancement-card').innerText(),/资深试炼/);
  await page.locator('.guild-tabs [data-guild-tab="history"]').click();page.once('dialog',d=>d.accept());await page.locator('#guild-import').setInputFiles(backup);
  const ready=JSON.parse(fs.readFileSync(backup,'utf8'));await page.waitForFunction(()=>JSON.parse(localStorage.getItem('abbey-guild-v6')).clears.veteran===1);assert.deepEqual(await state(),ready);
  await team('d');await openCareer();const before=await state(),start=member(before,'d').xp;
  await page.locator('[data-advancement="wardcraft"]').click();assert.equal(member(await state(),'d').xp,start-80);assert.deepEqual(member(await state(),'d').training,member(before,'d').training);
  await openCareer();await page.locator('[data-reset-advancement="d"]').click();assert.equal(member(await state(),'d').xp,start);await openCareer();await page.locator('[data-advancement="sigilcraft"]').click();
  assert.equal(member(await state(),'d').xp,start-80);assert.deepEqual(member(await state(),'d').unlocked,member(before,'d').unlocked);
  steps.push('新公会进阶门槛拒绝；恢复经8次正常疗所和1次资深通关赚取的备份，选择/退回/重选各精确80经验，普通训练和课程保留');
  await team('f');await openCareer();await page.locator('[data-advancement="apothecary"]').click();
  await page.locator('header [data-view="compare"]').click();for(const id of ['sample-table','pressure-table','reserve-table'])await page.locator('#'+id+' table').waitFor({state:'attached'});await page.locator('#lab-presets>summary').click();await page.locator('#hospice-start').click();
  await page.locator('header [data-view="guild"]').click();for(const [id,mode] of [['d','suppress'],['f','slowcare']]){await page.locator(`[data-companion="${id}"]`).selectOption(mode);await page.locator(`[data-apply-companion="${id}"]`).click();}
  await page.locator('#companion-room').selectOption('cistern');const preview=page.locator('.companion-grid article').filter({has:page.locator('[data-companion="d"]')});await preview.locator('.companion-preview>summary').click();assert.match(await preview.innerText(),/每次 4 法力/);
  const paid=await state();await page.locator('.guild-tabs [data-guild-tab="departure"]').click();assert.match(await page.locator('.ready-hero').filter({has:page.locator('[data-ready-edit="d"]')}).innerText(),/后期进阶：制符研修/);await page.locator('[data-guild="depart"]').click();report=await exported();
  assert.equal(report.config.heroes.find(h=>h.id==='d').advancement,'sigilcraft');assert.equal(report.config.heroes.find(h=>h.id==='f').advancement,'apothecary');
  const cast=report.events.find(e=>e.type==='cast'&&e.detail.skill==='suppress'&&e.detail.advancement);assert.ok(cast);assert.equal(cast.detail.mpBefore-cast.detail.mpAfter,4);
  assert.ok(report.events.some(e=>e.type==='effect'&&e.actor==='f'&&e.detail.stat==='regeneration'&&e.detail.value===10));
  await show(cast);assert.match(await page.locator('.advancement-proof').innerText(),/制符研修.*基础6 → 实际4/);await page.locator('.advancement-proof').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'v56-advancement-proof.png')});
  assert.deepEqual((await state()).members,paid.members);const pending=JSON.stringify((await state()).pending);
  steps.push('公会实际进阶进入职责预览、核对和战报：截疗扣4法力仍用符纸，调剂药敷记录为10；普通技能与训练不被替换');
  const mobile=await browser.newContext({viewport:{width:390,height:844},storageState:await context.storageState(),isMobile:true}),mp=await mobile.newPage();watch(mp);await mp.goto(url);await mp.locator('header [data-view="guild"]').click();await mp.locator('.guild-tabs [data-guild-tab="team"]').click();await mp.locator('[data-member="f"]').click();await mp.locator('.advancement-card>summary').click();assert.match(await mp.locator('.advancement-card').innerText(),/调剂研修/);assert.equal(await mp.locator('[data-reset-advancement="f"]').isDisabled(),true);const geom=await mp.locator('.advancement-card').evaluate(el=>({w:el.clientWidth,s:el.scrollWidth}));assert.ok(geom.s<=geom.w+2);await mp.locator('.advancement-card').scrollIntoViewIfNeeded();await mp.screenshot({path:path.join(out,'v56-mobile-advancement.png')});await mobile.close();assert.equal(JSON.stringify((await state()).pending),pending);
  await page.locator('header [data-view="guild"]').click();await page.locator('[data-guild="claim"]').click();const id=(await state()).history[0].id;await team('d');await openCareer();const beforeReset=member(await state(),'d').xp;await page.locator('[data-reset-advancement="d"]').click();assert.equal(member(await state(),'d').xp,beforeReset+80);const afterReset=JSON.stringify(await state());await page.locator('.guild-tabs [data-guild-tab="history"]').click();await page.locator(`[data-history-report="${id}"]`).click();const replay=await exported();assert.deepEqual(replay,report);assert.equal(JSON.stringify(await state()),afterReset);
  steps.push('未结算时移动视口锁定重选；结算退回当前进阶后，历史仍精确重演当时进阶且不重复收费或领奖');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-v56.json'),JSON.stringify({passed:true,steps,errors,browser:await browser.version(),prerequisites:{completed:ready.history.length,veteran:ready.clears.veteran,availableBefore:start},run:{seed:report.config.seed,won:report.won,rooms:report.rooms.length},example:{event:cast.id,skill:cast.detail.skill,baseMana:6,actualMana:4}},null,2));console.log(steps.join('\n'));
 }catch(e){await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'browser-v56.json'),JSON.stringify({passed:false,steps,errors,error:String(e)},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
