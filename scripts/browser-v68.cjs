const {chromium}=require(process.env.WOD_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=process.env.WOD_EVIDENCE_DIR||'/tmp/wod-browser-v68',url=process.env.WOD_BASE_URL||'http://127.0.0.1:8000';
const seer=process.env.WOD_SEER_GUILD||'/tmp/wod-v68-seer.json',earned=process.env.WOD_EARNED_GUILD||'/tmp/wod-v62-early.json';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.WOD_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const steps=[],errors=[],runs=[];let active;
 const watch=p=>{active=p;p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status());});};
 const state=p=>p.evaluate(()=>({g:JSON.parse(localStorage.getItem('abbey-guild-v6')),c:JSON.parse(localStorage.getItem('abbey-expedition-v40'))}));
 const guild=async(p,pane='hero')=>{await p.locator('header [data-view="guild"]').click();await p.locator(`.guild-tabs [data-guild-tab="${pane}"]`).click();};
 const plans=async p=>{await p.locator('header [data-view="planning"]').click();await p.locator('[data-prep="plans"]').click();};
 const role=async(p,id,mode)=>{await guild(p);await p.locator(`[data-companion="${id}"]`).selectOption(mode);await p.locator(`[data-apply-companion="${id}"]`).click();};
 const edit=async p=>{await guild(p);await p.locator('.command-home [data-ready-edit="d"]').click();};
 async function boot(backup=seer,mobile=false){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile}),p=await context.newPage();watch(p);
  await p.goto(url);await p.locator('[data-own-hero="c"]').click();await p.locator('.guild-tabs [data-guild-tab="history"]').click();p.once('dialog',d=>d.accept());await p.locator('#guild-import').setInputFiles(backup);
  const expected=JSON.parse(fs.readFileSync(backup,'utf8'));await p.waitForFunction(n=>JSON.parse(localStorage.getItem('abbey-guild-v6')).next===n,expected.next);return {context,p};
 }
 try{
  // The undo must compensate only its role change, after unrelated normal transactions.
  let {context,p}=await boot();const before=await state(p);await edit(p);assert.equal((await state(p)).g.command.companions.d,'custom');
  await p.locator('#editor select[data-field="skill"][data-phase="main"][data-row="0"]').selectOption('wait');
  await guild(p,'team');await p.locator('[data-member="d"]').click();await p.locator('[data-learn="skill:ward"]').click();await role(p,'f','medic');const changed=await state(p);
  await plans(p);assert.match(await p.locator('#undo-load').innerText(),/配置与伙伴职责/);assert.match(await p.locator('#undo-description').innerText(),/维斯.*训练、装备/);await p.locator('#undo-load').click();
  const restored=await state(p);assert.deepEqual(restored.c,before.c);assert.equal(restored.g.command.companions.d,'seer');assert.equal(restored.g.command.companions.f,'medic');assert.deepEqual(restored.g.members,changed.g.members);assert.equal(restored.g.gold,changed.g.gold);assert.equal(await p.locator('#undo-load').isDisabled(),true);
  const expectedActual=await p.evaluate(async()=>{const {guildConfig}=await import('./expedition-guild.mjs');return guildConfig(JSON.parse(localStorage.getItem('abbey-guild-v6')),JSON.parse(localStorage.getItem('abbey-expedition-v40')));});
  await guild(p,'departure');await p.locator('[data-guild="depart"]').click();const download=p.waitForEvent('download');await p.locator('#download').click();const report=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));assert.deepEqual(report.config.heroes,expectedActual.heroes);assert.equal(report.config.seed,restored.g.next);runs.push({seed:report.config.seed,won:report.won,rooms:report.rooms.length});
  steps.push('实际队伍编辑后撤销同时恢复先觉截疗与完整原草稿，保留期间真实训练和另一伙伴职责；正式出征采用恢复后的实际配置');await context.close();

  ({context,p}=await boot());await guild(p,'departure');await p.locator('#check-scope').selectOption('gallery');await p.locator('#guild .cooperation-resources>summary').click();const materialBefore=await state(p);await p.locator('#guild tr[data-resource-actor="d"][data-resource-phase="main"]').first().locator('button').click();await plans(p);await p.locator('#undo-load').click();assert.deepEqual(await state(p),materialBefore);steps.push('共享材料普通指令入口的职责切换也可完整撤销');await context.close();

  ({context,p}=await boot());const installBefore=await state(p);await guild(p,'team');await p.locator('[data-member="d"]').click();await p.locator('[data-install="foresight"]').click();assert.equal((await state(p)).g.command.companions.d,'custom');await plans(p);await p.locator('#undo-load').click();assert.deepEqual(await state(p),installBefore);steps.push('加入已学习高阶指令后可恢复原托管与配置，课程和资产未被撤回');await context.close();

  ({context,p}=await boot());await edit(p);await role(p,'d','measured');await plans(p);const conflicted=await state(p);await p.locator('#undo-load').click();assert.match(await p.locator('#notice').innerText(),/职责已另行调整/);assert.deepEqual(await state(p),conflicted);assert.equal(await p.locator('#undo-load').isEnabled(),true);await role(p,'d','custom');await plans(p);await p.locator('#undo-load').click();assert.equal((await state(p)).g.command.companions.d,'seer');steps.push('目标职责另改后拒绝整次撤销且保存撤销记录，恢复兼容状态后可重试');await context.close();

  ({context,p}=await boot());await edit(p);await guild(p,'departure');await p.locator('[data-guild="depart"]').click();await plans(p);const pending=await state(p);await p.locator('#undo-load').click();assert.match(await p.locator('#notice').innerText(),/领取远征结算/);assert.deepEqual(await state(p),pending);steps.push('已有待结算远征时不撤销职责或草稿，不改写出征快照');await context.close();

  ({context,p}=await boot());const original=await state(p);await edit(p);const other=await context.newPage();watch(other);await other.goto(url);await role(other,'f','medic');await plans(p);const concurrent=await state(p);await p.locator('#undo-load').click();assert.match(await p.locator('#notice').innerText(),/另一页面已修改公会/);assert.deepEqual(await state(p),concurrent);await guild(p);await plans(p);await p.locator('#undo-load').click();const refreshed=await state(p);assert.deepEqual(refreshed.c,original.c);assert.equal(refreshed.g.command.companions.d,'seer');assert.equal(refreshed.g.command.companions.f,'medic');steps.push('其他页面写入时拒绝覆盖，重新读取后撤销只恢复涉及职责并保留另一页面选择');await context.close();

  ({context,p}=await boot());const storageBefore=await state(p);
  const failOnce=async key=>p.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key){Storage.prototype.setItem=original;throw new DOMException('模拟写入失败','QuotaExceededError');}return original.call(this,k,v);};},key);
  await failOnce('abbey-guild-v6');await edit(p);assert.match(await p.locator('#notice').innerText(),/准备配置已回退/);assert.deepEqual(await state(p),storageBefore);
  await edit(p);await plans(p);const beforeUndo=await state(p);await p.locator('#undo-load').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'v68-desktop-undo.png')});
  for(const key of ['abbey-expedition-v40','abbey-guild-v6']){await failOnce(key);await p.locator('#undo-load').click();assert.match(await p.locator('#notice').innerText(),/无法撤销.*保存失败/);assert.deepEqual(await state(p),beforeUndo);assert.equal(await p.locator('#undo-load').isEnabled(),true);}
  await p.locator('#undo-load').click();assert.deepEqual(await state(p),storageBefore);steps.push('模拟配置或公会写入失败时不留半完成职责；公会后写失败回退配置，撤销记录保留并可重试');await context.close();

  ({context,p}=await boot(earned,true));await guild(p,'roster');await p.locator('[data-swap="mira"]').click();const historicalBefore=await state(p);await guild(p,'history');await p.locator('[data-history-compare="2"]').click();await p.locator('[data-reuse-open]').click();await p.locator('[data-reuse-apply]').click();assert.equal((await state(p)).g.command.companions.mira,'custom');await plans(p);assert.match(await p.locator('#undo-description').innerText(),/米菈/);const geom=await p.locator('#undo-description').evaluate(e=>({width:e.parentElement.clientWidth,scroll:e.parentElement.scrollWidth}));assert.ok(geom.scroll<=geom.width+2);await p.locator('#undo-description').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'v68-mobile-undo.png')});await p.locator('#undo-load').click();assert.deepEqual(await state(p),historicalBefore);
  // Loading an ordinary preset supersedes the single undo slot without restoring an older role.
  await guild(p);await p.locator('.command-home [data-ready-edit="mira"]').click();const custom=await state(p);await p.locator('#reset').click();await plans(p);assert.equal(await p.locator('#undo-load').innerText(),'撤销上次载入');await p.locator('#undo-load').click();assert.deepEqual(await state(p),custom);await context.close();steps.push('390px历史单人复用可连同原职责撤销且无横向溢出；普通方案载入仍只撤销最近配置，不回放旧职责变化');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-v68.json'),JSON.stringify({passed:true,steps,errors,runs,browser:await browser.version()},null,2));console.log(steps.join('\n'));
 }catch(e){await active?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'browser-v68.json'),JSON.stringify({passed:false,steps,errors,error:String(e)},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
