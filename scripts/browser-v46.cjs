require('./capture-bootstrap.cjs');
const {chromium}=require(process.env.WOD_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const evidence=process.env.WOD_EVIDENCE_DIR||'/tmp/wod-browser-v46';fs.mkdirSync(evidence,{recursive:true});
const output=name=>path.join(evidence,name),baseUrl=process.env.WOD_BASE_URL||'http://127.0.0.1:8000';
(async()=>{
const browser=await chromium.launch({executablePath:process.env.WOD_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
const errors=[],failedResponses=[],steps=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failedResponses.push({url:r.url(),status:r.status()});});
const note=s=>{steps.push(s);console.log(s);};
const guild=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('abbey-guild-v6')));
const draft=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('abbey-expedition-v40')));
const assets=g=>JSON.stringify({gold:g.gold,members:g.members.map(m=>({id:m.id,xp:m.xp,gear:m.gear,owned:m.owned,training:m.training})),warehouse:g.warehouse});
try{
await page.goto(baseUrl);await page.locator('[data-own-hero="c"]').click();
for(let i=0;i<2;i++){
 await page.locator('.guild-tabs [data-guild-tab="departure"]').click();await page.locator('[data-guild="depart"]').click();await page.locator('#result').waitFor({state:'visible'});
 await page.locator('header [data-view="guild"]').click();await page.locator('[data-guild="claim"]').click();
}
assert.equal((await guild()).history.length,2);note('通过两次正常公会远征领取奖励，未注入金币或经验');
await page.locator('.guild-tabs [data-guild-tab="roster"]').click();await page.locator('[data-recruit="orin"]').click();
await page.locator('#replace-orin').selectOption('e');await page.locator('[data-swap="orin"]').click();
let g=await guild();assert.ok(g.lineup.includes('orin'));assert.ok(!g.lineup.includes('e'));assert.equal(g.members.find(m=>m.id==='e').id,'e');note('招募奥林并轮换塞恩，候补与原成员资产保留');
await page.locator('.guild-tabs [data-guild-tab="hero"]').click();
await page.locator('[data-companion="orin"]').selectOption('field');await page.locator('[data-apply-companion="orin"]').click();
await page.locator('.guild-tabs [data-guild-tab="departure"]').click();await page.locator('#check-scope').selectOption('gallery');
let check=await page.locator('#departure-check .cooperation-check').innerText();assert.match(check,/奥林 → 全队 \/ ≤50%/);assert.match(check,/未配置此辅助/);
const before=await guild();await page.locator('#departure-check [data-cooperation-edit="orin"]').click();
assert.equal(await page.locator('#plan-scope').inputValue(),'gallery');assert.equal(await page.locator('#editor [data-field="heal-threshold"]').inputValue(),'0.5');
assert.equal((await guild()).command.companions.orin,'custom');assert.equal(assets(await guild()),assets(before));
await page.locator('#editor [data-field="heal-target"]').selectOption('center');
await page.locator('#guild-run').click();await page.locator('#check-scope').selectOption('gallery');
assert.match(await page.locator('#departure-check .cooperation-check').innerText(),/奥林 → 中央 \/ ≤50%/);
assert.equal(assets(await guild()),assets(before));note('托管职责按实际配置核对；提示跳转保留50%阈值，改为中央后重新核对，资产未变化');
await page.locator('[data-guild="prepare"]').click();await page.locator('[data-prep="team"]').click();
for(const [key,value] of Object.entries({herb:12,rune:14,arrow:10})){
 const input=page.locator(`[data-supply="${key}"]`);await input.fill(String(value));await input.dispatchEvent('change');
}
await page.locator('#expedition').selectOption('harbor');await page.locator('[data-prep="events"]').click();
for(const [key,value] of Object.entries({difficulty:'storm',pass:'upper',task:'seal',reserve:'seal'}))await page.locator(`[data-harbor="${key}"]`).selectOption(value);
await page.locator('[data-harbor-tactics="roles"]').click();assert.equal((await draft()).expedition,'harbor');
await page.locator('[data-prep="team"]').click();await page.locator('#deploy-scope').selectOption('harbor_pass');
await page.locator('#deployment [data-cooperation-edit="orin"]').click();assert.equal(await page.locator('#plan-scope').inputValue(),'harbor_pass');
await page.locator('#editor [data-field="heal-target"]').selectOption('rear');
await page.locator('#guild-run').click();await page.locator('#check-scope').selectOption('harbor_pass');
check=await page.locator('#departure-check .cooperation-check').innerText();assert.match(check,/奥林 → 后排/);assert.match(check,/同名效果互斥/);assert.match(check,/共享药草配置/);
const readonly=JSON.stringify(await guild());await page.locator('#check-scope').selectOption('harbor_cache');await page.locator('#check-scope').selectOption('harbor_pass');assert.equal(JSON.stringify(await guild()),readonly);
await page.locator('#departure-check .cooperation-check').scrollIntoViewIfNeeded();await page.screenshot({path:output('v46-desktop-check.png')});
note('风暴职责方案应用后，准备页与实际出征页的逐房协作核对一致；切换核对范围不写存档');
const storage=await context.storageState();
await page.locator('[data-guild="depart"]').click();await page.locator('#result').waitFor({state:'visible'});await page.locator('.replay-tabs [data-replay-pane="review"]').click();
const ledger=page.locator('#harbor-assessment details.review-room').filter({has:page.getByRole('button',{name:'首次资源不足',exact:true,includeHidden:true})}).first();await ledger.locator('summary').first().click();
const targetRoom=(await ledger.locator('[data-review-edit]').first().getAttribute('data-review-edit')).split(':')[0];
const shortage=ledger.getByRole('button',{name:'首次资源不足',exact:true}).first();await shortage.click();assert.equal(await page.locator('#report').getAttribute('data-workspace'),'evidence');assert.ok((await page.locator('#detail').innerText()).length>30);
await page.locator('.replay-tabs [data-replay-pane="review"]').click();await ledger.locator('[data-review-edit]').first().click();
assert.equal(await page.locator('#plan-scope').inputValue(),targetRoom);assert.ok(await page.locator('#a-state').innerText().then(t=>t.includes('已保存')));
await page.screenshot({path:output('v46-ledger-edit.png')});note('真实公会港口出征生成战报，逐房账本跳转行动证据，再从战报改配并冻结A');
const mobile=await browser.newContext({viewport:{width:390,height:844},storageState:storage,isMobile:true,deviceScaleFactor:1});const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(String(e)));
await mp.goto(baseUrl);await mp.locator('.guild-tabs [data-guild-tab="departure"]').click();await mp.locator('#check-scope').selectOption('harbor_pass');
await mp.locator('#departure-check .cooperation-check').scrollIntoViewIfNeeded();
const geometry=await mp.locator('#departure-check .cooperation-check').evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth,viewport:innerWidth}));assert.ok(geometry.scroll<=geometry.width+2,JSON.stringify(geometry));
await mp.screenshot({path:output('v46-mobile-check.png')});note('390px移动视口复用正常流程存档核对，无协作面板横向溢出');await mobile.close();
assert.deepEqual(errors,[]);assert.ok(failedResponses.every(r=>r.url().endsWith('/favicon.ico')),JSON.stringify(failedResponses));
fs.writeFileSync(output('browser-v46.json'),JSON.stringify({passed:true,steps,errors,failedResponses,browser:await browser.version()},null,2));
}catch(e){await page.screenshot({path:output('browser-failure.png')});fs.writeFileSync(output('browser-v46.json'),JSON.stringify({passed:false,steps,errors,failedResponses,error:String(e)},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
