require('./capture-bootstrap.cjs');
const {chromium}=require(process.env.WOD_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const out=process.env.WOD_EVIDENCE_DIR||'/tmp/wod-v138',url=process.env.WOD_BASE_URL||'http://127.0.0.1:8002';
fs.mkdirSync(out,{recursive:true});
const read=k=>JSON.parse(fs.readFileSync(path.join(out,'focus-'+k+'.json'),'utf8'));
(async()=>{
 const load=name=>import(pathToFileURL(path.join(__dirname,'../dist/'+name)).href);
 const {captureCampaign,CAMPAIGN_KEYS}=await load('expedition-campaign-backup.mjs');
 const {replaySteps}=await load('expedition-stage.mjs'),{highlightedSteps}=await load('expedition-highlights.mjs'),{personalSteps}=await load('expedition-personal.mjs'),{historyReport}=await load('expedition-guild.mjs');
 const guild=read('final'),report=read('2-report'),preparation=read('2-config');preparation.seed=731;
 const rawSource={[CAMPAIGN_KEYS[0]]:JSON.stringify(preparation),[CAMPAIGN_KEYS[1]]:JSON.stringify({version:1,plans:[],bindings:{}}),[CAMPAIGN_KEYS[2]]:null,[CAMPAIGN_KEYS[3]]:JSON.stringify(guild)};
 const backup=await captureCampaign({getItem:k=>rawSource[k]??null},'2026-11-06T12:00:00Z'),file=path.join(out,'keyboard-campaign.json');
 fs.writeFileSync(file,JSON.stringify(backup));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),steps=[],errors=[];let active;
 const selected=p=>p.locator('#journal .journal-row.selected').getAttribute('data-event').then(Number);
 const raw=p=>p.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),CAMPAIGN_KEYS);
 const download=async p=>{const w=p.waitForEvent('download');await p.locator('#download').click();return JSON.parse(fs.readFileSync(await(await w).path(),'utf8'));};
 async function restore(p){
  await p.goto(url);await p.locator('[data-own-hero=e]').click();await p.locator('header [data-view=guild]').click();await p.locator('[data-guild-tab=history]').click();
  await p.locator('#campaign-import').setInputFiles(file);await p.locator('.campaign-preview').waitFor();
  await Promise.all([p.waitForEvent('load'),p.locator('[data-campaign-restore]').click()]);
  await p.waitForFunction(()=>JSON.parse(localStorage.getItem('abbey-guild-v6'))?.gold===6665);
  await p.locator('header [data-view=guild]').click();await p.locator('[data-guild-tab=history]').click();await p.locator('[data-history-report="61"]').click();
  assert.deepEqual(await download(p),report);assert.deepEqual(JSON.parse((await raw(p))[CAMPAIGN_KEYS[3]]),guild);
 }
 async function press(p,key){await p.locator('.replay-controls').focus();await p.keyboard.press(key);}
 async function boundaries(p,list){
  await press(p,'Home');assert.equal(await selected(p),list[0].start);assert.equal(await p.locator('#prev').isDisabled(),true);
  await press(p,'ArrowLeft');assert.equal(await selected(p),list[0].start);
  await press(p,'ArrowRight');assert.equal(await selected(p),list[1].start);
  await press(p,'End');assert.equal(await selected(p),list.at(-1).start);assert.equal(await p.locator('#next').isDisabled(),true);
  await press(p,'ArrowRight');assert.equal(await selected(p),list.at(-1).start);
  await press(p,'ArrowLeft');assert.equal(await selected(p),list.at(-2).start);
 }
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage();active=p;p.on('pageerror',e=>errors.push(e.stack));await restore(p);const before=await raw(p),initial=await selected(p);
  if(process.env.WOD_KEYBOARD_BASELINE==='1'){
   const focus=await p.locator('.replay-controls').evaluate(el=>{el.focus();return{tabIndex:el.tabIndex,focused:document.activeElement===el};});
   await p.keyboard.press('ArrowRight');assert.equal(await selected(p),initial);assert.equal(focus.tabIndex,-1);assert.equal(focus.focused,false);assert.deepEqual(await raw(p),before);
   fs.writeFileSync(path.join(out,'keyboard-baseline.json'),JSON.stringify({passed:true,baseline:'v137 b4aa91b',focus,initialEvent:initial,afterArrowRight:await selected(p),guildPreparationPlansComparisonAllRawExact:true,pageErrors:errors},null,2));return;
  }
  await p.locator('.replay-tabs [data-replay-pane=review]').focus();await p.keyboard.press('Tab');
  assert.equal(await p.locator('.replay-controls').evaluate(el=>document.activeElement===el),true);
  assert.equal(await p.locator('.replay-controls').getAttribute('role'),'group');
  await boundaries(p,replaySteps(report.events,false));assert.equal(await p.locator('#room').inputValue(),String(report.rooms.length-1));
  await p.locator('#highlights-only').check();await boundaries(p,highlightedSteps(report.events));
  await p.locator('#highlights-only').uncheck();await p.locator('[data-replay-pane=evidence]').first().click();await p.locator('#diagnostic').check();await boundaries(p,replaySteps(report.events,true));
  await p.locator('#diagnostic').uncheck();await p.locator('#personal-playback').check();await boundaries(p,personalSteps(replaySteps(report.events,false),'e'));
  steps.push('桌面Tab实际进入控制栏；合并行动、精选、逐条诊断和本人筛选四模式的首末边界、前后一步与跨房定位均精确匹配既有步骤，筛选未被清除。');
  await p.locator('#personal-playback').uncheck();await press(p,'Home');const at=await selected(p);
  await p.locator('#play-speed').focus();await p.keyboard.press('ArrowDown');assert.equal(await selected(p),at);assert.equal(await p.locator('#play-speed').inputValue(),'2');
  await p.locator('#play-speed').selectOption('1');await p.locator('#personal-playback').focus();await p.keyboard.press('Space');assert.equal(await p.locator('#personal-playback').isChecked(),true);assert.match(await p.locator('#play').innerText(),/播放/);
  await p.keyboard.press('Space');assert.equal(await p.locator('#personal-playback').isChecked(),false);
  await press(p,'Home');const same=await selected(p);await press(p,'Control+ArrowRight');assert.equal(await selected(p),same);
  const ime=await p.locator('.replay-controls').evaluate(el=>{const e=new KeyboardEvent('keydown',{key:'ArrowRight',isComposing:true,bubbles:true,cancelable:true});el.dispatchEvent(e);return e.defaultPrevented;});assert.equal(ime,false);assert.equal(await selected(p),same);
  await p.locator('#play').focus();await p.keyboard.press('Space');assert.match(await p.locator('#play').innerText(),/暂停/);await p.keyboard.press('Space');assert.match(await p.locator('#play').innerText(),/播放/);
  await p.locator('#pause-scenes').uncheck();await p.locator('#play-speed').selectOption('4');await press(p,'Home');await p.locator('.replay-controls').focus();await p.keyboard.down('Space');assert.match(await p.locator('#play').innerText(),/暂停/);await p.keyboard.down('Space');assert.match(await p.locator('#play').innerText(),/暂停/);await p.keyboard.up('Space');
  await p.waitForFunction(n=>Number(document.querySelector('#journal .journal-row.selected').dataset.event)!==n,same);await p.keyboard.press('Space');assert.match(await p.locator('#play').innerText(),/播放/);
  steps.push('原生速度选择、复选框和播放按钮保留自己的按键；Ctrl组合及IME不被截获。控制栏空格实际播放/暂停，长按重复keydown不会反复切换。');
  await p.locator('[data-replay-pane=battle]').first().click();await press(p,'Home');await p.locator('.replay-controls').screenshot({path:path.join(out,'keyboard-desktop.png')});
  assert.deepEqual(await download(p),report);assert.deepEqual(await raw(p),before);assert.equal(await p.locator('[data-report-cycle=claim]').count(),0);
  await p.locator('header [data-view=planning]').click();await p.locator('[data-prep=plans]').click();await p.locator('#plan-name').fill('键盘验证');await p.locator('#plan-name').press('Home');await p.locator('#plan-name').press('ArrowRight');assert.equal(await p.locator('#plan-name').inputValue(),'键盘验证');
  const hidden=await p.locator('.replay-controls').evaluate(el=>{const e=new KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true});el.dispatchEvent(e);return e.defaultPrevented;});assert.equal(hidden,false);assert.equal(await selected(p),replaySteps(report.events,false)[0].start);assert.deepEqual(await raw(p),before);
  steps.push('完整61报告、四个整档原始存储键及6665/next62全字段未变；只读历史不能重领奖。离开回放后输入和隐藏控制栏事件均不触发导航。');await context.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),m=await mobile.newPage();active=m;m.on('pageerror',e=>errors.push(e.stack));await restore(m);const mobileBefore=await raw(m);
  await boundaries(m,replaySteps(report.events,false));await press(m,'Home');await m.locator('#next').tap();assert.equal(await selected(m),replaySteps(report.events,false)[1].start);await m.locator('#prev').tap();assert.equal(await selected(m),replaySteps(report.events,false)[0].start);
  await m.locator('.replay-controls').focus();await m.locator('.replay-controls').screenshot({path:path.join(out,'keyboard-mobile.png')});assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await m.locator('header [data-view=guild]').click();await m.locator('[data-guild-tab=history]').click();await m.locator('[data-history-report="55"]').click();const failure=historyReport(guild,55);assert.equal(failure.won,false);assert.deepEqual(await download(m),failure);await boundaries(m,replaySteps(failure.events,false));assert.deepEqual(await download(m),failure);assert.deepEqual(await raw(m),mobileBefore);
  steps.push('390px新上下文恢复后，键盘与原触摸按钮一致，无横向溢出；原55失败战报同样能首末/前后导航，整份失败报告与公会原文保持。没有新远征、资源消耗或奖励。');await mobile.close();
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-v138.json'),JSON.stringify({passed:true,steps,errors,normalGuildGold:6665,next:62,newDepartures:0,newRewards:0},null,2));console.log(steps.join('\n'));
 }catch(e){fs.writeFileSync(path.join(out,'browser-v138.json'),JSON.stringify({passed:false,steps,errors,error:e.stack},null,2));if(active)await active.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
