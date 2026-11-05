import {scheduleLabel} from './expedition-schedule.mjs';
import {saveEquipmentSet,applyEquipmentSet,deleteEquipmentSet} from './expedition-guild.mjs';
import {GOALS,withObjective} from './expedition-goal-data.mjs';
import {bookProof,bookReport,bookOrigin} from './expedition-book.mjs';
import {expeditionBookView,objectiveResultView} from './expedition-book-view.mjs';
import {campObjective,pendingOrigin,claimReport,readCycleGuild} from './expedition-camp-cycle.mjs';
import {campCycleView} from './expedition-camp-cycle-view.mjs';
import {adventureConfig} from './expedition-adventure.mjs';
import {stockFloorLabel} from './expedition-stock-floor.mjs';
import {mediumLabel} from './expedition-media-data.mjs';
import {commandCostText} from './expedition-media.mjs';
import {shoalsAtlasView} from './expedition-shoals-view.mjs';
import {shoalsChartId} from './expedition-shoals.mjs';
import {COURIER_PASSES,courierPass} from './expedition-courier.mjs';
import {harborStoryView} from './expedition-harbor-story-view.mjs';
import {foundryStoryView} from './expedition-foundry-story-view.mjs';
import {foundryApproach,FOUNDRY_APPROACHES,FOUNDRY_PASSAGE_RULE} from './expedition-foundry.mjs';
import {foundryContracts} from './expedition-foundry-contract-view.mjs';
import {FOUNDRY_OBJECTIVES} from './expedition-foundry-contract.mjs';
import {shoalsConfig,courierConfig,chapterConfig,harborConfig,watchConfig,foundryConfig} from './expedition-data.mjs';
import {historyTacticPreview,reuseHistoryTactic} from './expedition-tactic-reuse.mjs';
import {draftCommandPreview,adoptDraftCommands} from './expedition-draft-commands.mjs';
import {configurationUndo,restoreConfigurationUndo,commitPreparationChange} from './expedition-config-undo.mjs';
import {validate} from './expedition-engine.mjs';
import {tacticReuseView} from './expedition-tactic-reuse-view.mjs';
import {lineupChangesView} from './expedition-lineup-diff.mjs';
import {initialTargetWarningsView} from './expedition-target-check.mjs';
import {rehearseTrainingPlan} from './expedition-training-rehearsal.mjs';
import {rehearseReplacement,replacementSignature} from './expedition-roster-rehearsal.mjs';
import {trainingRehearsalView} from './expedition-training-rehearsal-view.mjs';
import {quoteTrainingPlan,trainingSnapshot} from './expedition-training-plan.mjs';
import {trainingPlanView} from './expedition-training-plan-view.mjs';
import {PROGRESSION_RULES,COURSE_REQUIRED_XP,trainingCostText,trainingTotalText} from './expedition-progression-rules.mjs';
import {experienceView} from './expedition-progression-view.mjs';
import {ADVANCEMENTS,ADVANCEMENT_REQUIRED_XP,ADVANCEMENT_COST} from './expedition-advancement-data.mjs';
import {advancementStatus} from './expedition-advancement.mjs';
import {cooperationView} from './expedition-cooperation.mjs';
import {HARBOR_RESERVE,harborReserve} from './expedition-harbor-reserve.mjs';
import {HARBOR_PASS,HARBOR_TASK,HARBOR_DIFFICULTY,harborDifficulty} from './expedition-harbor.mjs';
import {harborContracts} from './expedition-harbor-contract-view.mjs';
import {HARBOR_OBJECTIVES} from './expedition-harbor-contract.mjs';
import {equipmentPanel} from './expedition-equipment-view.mjs';
import {equipmentName,SLOTS} from './expedition-equipment.mjs';
import {rosterConfig,recruit,swapCompanion,replacementChoices} from './expedition-roster.mjs';
import {rosterHome} from './expedition-roster-view.mjs';
import {commandHome} from './expedition-command-view.mjs';
import {selectHero,setCompanion,commandLabel} from './expedition-command.mjs';
import {historyComparison} from './expedition-history-diff.mjs';
import {readiness,customizeForEditing} from './expedition-readiness.mjs';
import {trainingQuote,trainingInvestment} from './expedition-training.mjs';
import {ADVANCED,UNLOCK_COST,growth,isAdvanced,installAdvanced} from './expedition-growth.mjs';
import {rewardPreview,gearDifference,isRelic} from './expedition-loot.mjs';
import {redeemHarbor,GUILD_KEY,GEAR_PRICE,historyConfig,historyReport,claimFoundryStory,claimHarborStory,newGuild,validateGuild,migrateGuild,pendingReward,assignLoot,sellLoot,guildConfig,depart,pendingReport,rewardFor,claim,train,lowerTraining,applyTrainingPlan,chooseAdvancement,resetAdvancement,equip,retrain,learnAdvanced} from './expedition-guild.mjs';
import {HEROES,GEAR,ATTR,SKILLS,POS,DEFENSES,ITEMS,roomsFor,EXPEDITIONS,trainingOptions,trainingCost,MAX_TRAINING_RANK} from './expedition-data.mjs';
export function mountGuild({getConfig,loadConfig,showReport,view,tell,download,editHero,updateConfig,configKey}){
 const root=document.querySelector('#guild'),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let raw=null,g=null,selected='a',failure='',checkScope='',pane='hero',message='',gearFilter='owned',equipmentSlot='all',compareId=null,compareMode='draft',companionRoom='',previews={},reuseOpen=false,reuseSource='',reuseTarget='',reuseRooms=false,lastReusePreview=null;
 const lootLabel=items=>Object.entries(items.reduce((counts,id)=>(counts[id]=(counts[id]||0)+1,counts),{})).map(([id,n])=>GEAR[id].name+(n>1?' ×'+n:'')).join('、');
 let bookRoute='';
 const paneNames={goals:'攻略目标',journey:'单人旅程',roster:'招募与出战',hero:'我的英雄与伙伴',departure:'出征准备',team:'角色成长',equipment:'装备与仓库',contracts:'远征委托',history:'履历与备份'};
 const journeyNames={foundry:'铸库归航',harbor:'灯塔来信'};let journeyBook='foundry';
 try{const ui=JSON.parse(sessionStorage.getItem('abbey-guild-ui')||'null');if(ui){if(Object.hasOwn(journeyNames,ui.journeyBook))journeyBook=ui.journeyBook;if(Object.hasOwn(paneNames,ui.pane))pane=ui.pane;if(HEROES.some(h=>h.id===ui.selected))selected=ui.selected;if(typeof ui.checkScope==='string')checkScope=ui.checkScope;if(['owned','shop','all'].includes(ui.gearFilter))gearFilter=ui.gearFilter;}}catch{}
 function remember(){try{sessionStorage.setItem('abbey-guild-ui',JSON.stringify({pane,selected,checkScope,gearFilter,journeyBook}));}catch{}}
 function inform(text){message=text;tell(text);const box=root.querySelector("#guild-feedback");if(box)box.textContent=text;}
 function panels(){for(const el of root.querySelectorAll('[data-guild-pane]'))el.hidden=el.dataset.guildPane!==pane;for(const b of root.querySelectorAll('[data-guild-tab]')){const active=b.dataset.guildTab===pane;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}remember();}
 function switchPanel(next){pane=next;render();root.querySelector(`[data-guild-tab="${pane}"]`)?.focus();root.querySelector('.guild-tabs')?.scrollIntoView({block:'start'});}
 function read(){try{raw=localStorage.getItem(GUILD_KEY);g=migrateGuild(raw?JSON.parse(raw):newGuild());failure='';if(!raw)message='港口远征版使用独立公会存档；此前版本存档不迁移。请先选择自己的英雄。';}catch(e){g=null;failure=e.message;}}
 function save(next){validateGuild(next);if(localStorage.getItem(GUILD_KEY)!==raw)throw Error('另一页面已修改公会，请重新进入公会后再操作');const text=JSON.stringify(next);localStorage.setItem(GUILD_KEY,text);raw=text;g=next;}
 function savePreparation(config,guild){const stored=commitPreparationChange(localStorage,{configKey,guildKey:GUILD_KEY,expectedConfig:JSON.stringify(getConfig()),expectedGuild:raw,config,guild});raw=stored.guildRaw;g=guild;}
 function applyTacticEdit(edit,apply){validate(edit.config);const undo=configurationUndo(getConfig(),g,edit.guild);if(localStorage.getItem(GUILD_KEY)!==raw)throw Error('另一页面已修改公会，请重新进入公会后再操作');if(undo.roles)savePreparation(edit.config,edit.guild);apply(edit.config,undo,Boolean(undo.roles));}
 function undoConfiguration(undo){const restored=restoreConfigurationUndo(g,undo);if(restored.guild){savePreparation(restored.config,restored.guild);previews={};reuseOpen=false;lastReusePreview=null;}return {config:restored.config,persisted:Boolean(restored.guild)};}
 function renderDraftBridge({targetId,roomId=''}){
  const bridge=document.querySelector('#draft-command-bridge');if(!bridge)return;
  const mode=g?.command?.companions[targetId],managed=g?.command&&g.command.heroId!==targetId&&mode&&mode!=='custom';
  if(!managed||!g.lineup.includes(targetId)||!getConfig().heroes.some(h=>h.id===targetId)){bridge.hidden=true;bridge.innerHTML='';return;}
  bridge.hidden=false;bridge.className='tactic-reuse draft-command-bridge';
  bridge.innerHTML=`<h3>让草稿指令用于公会出征</h3><p>当前公会职责：${esc(commandLabel(g,targetId))}。公会仍采用该职责的指令；编辑器中的草稿可先预览，再明确应用。</p><p>${roomId?'只采用本房预备、普通和救护指令，其他房间保留当前实际指令。':'采用默认预备、普通和救护指令；已有实际逐房覆盖保留，其余房间继承新默认。'}目标的专修、站位、防御、道具策略与实际资产保留。应用会切到自定义，可在方案管理撤销。</p><button data-draft-preview="true">预览采用${roomId?'本房':'默认'}草稿指令</button>`;
  bridge.onclick=e=>{const b=e.target.closest('button');if(!b)return;try{
   if(b.dataset.draftPreview){const p=draftCommandPreview(g,getConfig(),{targetId,roomId});
    const panel=document.createElement('div');panel.className='draft-command-preview';panel.innerHTML=`<h4>${esc(p.targetName)} · ${esc(p.scopeName)}</h4><p>仅复制预备、普通与救护指令。当前专修、课程、训练、装备、经验和其他队员保留。</p><div class="table-scroll"><table><thead><tr><th>指令阶段</th><th>当前实际配置</th><th>将采用的配置</th></tr></thead><tbody>${p.commands.map(c=>`<tr><th>${esc(c.label)}${c.changed?'':'（相同）'}</th><td>${esc(c.before)}</td><td>${esc(c.after)}</td></tr>`).join('')}</tbody></table></div><small>窄屏可横向滚动查看将采用的指令。</small>${p.warnings.map(w=>`<p class="ready-diff">${esc(w)}</p>`).join('')}${p.reasons.map(r=>`<p class="ready-diff">${esc(r)}</p>`).join('')}<button data-draft-apply="true" ${p.allowed?'':'disabled'}>采用${roomId?'本房':'默认'}指令并切到自定义</button>`;
    bridge.querySelector('.draft-command-preview')?.remove();bridge.append(panel);panel.querySelector('[data-draft-apply]').onclick=ev=>{ev.stopPropagation();try{const result=adoptDraftCommands(g,getConfig(),p);applyTacticEdit(result,loadConfig);editHero(targetId,roomId);inform('已将'+p.targetName+'的'+p.scopeName+'草稿指令用于公会；'+(p.roomId?'其他房间、专修与当前资产保留':'已有逐房覆盖、专修与当前资产保留，其余房间继承新默认')+'，可撤销配置与本次职责变化。');}catch(error){tell(error.message);}};
    panel.scrollIntoView({block:'nearest'});
   }
  }catch(error){tell(error.message);}};
 }
 function comparisonHTML(){
 if(!compareId||!g.history.some(r=>r.id===compareId&&r.config))return '';
 const d=historyComparison(g,compareId,getConfig(),compareMode);
 let reuseHTML='';
 if(reuseOpen){
  const old=historyConfig(g,compareId),def=id=>HEROES.find(h=>h.id===id),sources=old.heroes.filter(h=>g.lineup.some(id=>def(id).classId===def(h.id).classId)).map(h=>def(h.id));
  if(!sources.length)reuseHTML='<section class="tactic-reuse"><p>当前没有可复用的同职业出战目标。</p><button data-reuse-close="true">关闭预览</button></section>';
  else{
   if(!sources.some(h=>h.id===reuseSource))reuseSource=d.lineup.left.find(h=>sources.some(s=>s.id===h.id))?.id||sources[0].id;
   const targets=g.lineup.map(def).filter(h=>h.classId===def(reuseSource).classId);
   if(!targets.some(h=>h.id===reuseTarget))reuseTarget=targets.find(h=>h.id===reuseSource)?.id||targets[0].id;
   if(old.expedition!==getConfig().expedition)reuseRooms=false;
   lastReusePreview=historyTacticPreview(g,getConfig(),{historyId:compareId,sourceId:reuseSource,targetId:reuseTarget,copyRooms:reuseRooms});reuseHTML=tacticReuseView(lastReusePreview,sources,targets);
  }
 }
 const rows=items=>items.length?`<div class="history-diff-scroll"><table class="history-diff-table"><thead><tr><th>配置项</th><th>历史出征</th><th>${compareMode==='guild'?'当前公会资产＋当前战术':'当前准备方案'}</th></tr></thead><tbody>${items.map(c=>`<tr><th scope="row">${esc(c.label)}</th><td>${esc(c.before)}</td><td>${esc(c.after)}</td></tr>`).join('')}</tbody></table></div>`:'<p>无差异。</p>';
 return `<section id="history-comparison" class="guild-panel" data-guild-pane="history"><h2>第${compareId}次远征 → 当前方案</h2><label>比较对象 <select id="history-compare-mode"><option value="draft" ${compareMode==='draft'?'selected':''}>当前准备方案</option><option value="guild" ${compareMode==='guild'?'selected':''}>当前公会资产＋当前战术</option></select></label><p>${d.total} 项配置差异。左侧为历史，右侧为当前；仅列出变化，不判断改动是否更好。</p><p>公会模式采用伙伴职责及现有装备与训练；种子仍显示准备页值，实际出征会分配新种子。技能学习与出征资格请到出征准备核对。差异也包括方案保留的其他房间槽，未在本路线示意中的覆盖不表示本次会执行。</p>${d.routeChanged?'<p class="ready-diff">两份方案路线不同；房间按配置槽比较，不代表相同敌人或战斗环境。</p>':''}${lineupChangesView(d.lineup,compareMode)}<h3>全队与路线</h3>${rows(d.global)}${d.heroes.map(h=>`<details ${h.changes.length?'open':''}><summary>${h.name} · ${h.changes.length} 项变化</summary>${rows(h.changes)}</details>`).join('')}${reuseHTML}<button data-reuse-open="true">复用历史单人战术</button><button data-history-load="${compareId}">载入这次历史方案</button><button data-history-close="true">关闭对比</button></section>`;
 }
 const trainingDrafts={},trainingRehearsals={};
 const replacementSelections={};let replacementTrial=null;
 function replacementTrialState(){if(!replacementTrial)return null;const r=replacementTrial,choice=replacementSelections[r.incoming]||replacementChoices(g,r.incoming)[0]?.id;return {value:r,stale:choice!==r.outgoing||r.signature!==replacementSignature(g,getConfig(),r.outgoing,r.incoming)};}
 const rehearsalSignature=plan=>JSON.stringify([raw,getConfig(),plan.expected,plan.target]);
 function render(){
 if(!g){root.innerHTML=`<h1>公会存档暂不可用</h1><p>${esc(failure)}。原存档未覆盖。</p><button data-guild="backup">导出原始存档</button><label>恢复有效备份 <input type="file" id="guild-import" accept="application/json,.json"></label>`;return;}
 if(!g.members.some(m=>m.id===selected))selected=g.lineup[0];
 if(checkScope&&!roomsFor(getConfig()).some(r=>r.id===checkScope))checkScope='';
 if(companionRoom&&!roomsFor(getConfig()).some(r=>r.id===companionRoom))companionRoom='';
 const ready=readiness(g,getConfig(),checkScope);
 const advancement=advancementStatus(g,selected);
 const m=g.members.find(h=>h.id===selected),hero=HEROES.find(h=>h.id===selected),pending=g.pending?pendingReward(g):null,progress=growth(m),advanced=ADVANCED[m.id],learned=m.unlocked.includes(advanced);const draft=trainingDrafts[selected],plan=quoteTrainingPlan(m,draft?.target||m.training,draft?{expected:draft.expected}:{});const trial=trainingRehearsals[selected],rehearsal=trial?.signature===rehearsalSignature(plan)?trial.value:null;
 root.innerHTML=`<div class="guild-hub"><p class="eyebrow">海岸公会 / 常驻营地</p><div class="guild-hub-row"><div><h1>整备，再次出发。</h1><p>${esc(EXPEDITIONS[getConfig().expedition].name)} · 金币 <strong>${g.gold}</strong> · 已完成 ${g.next-1-(g.pending?1:0)} 次远征</p></div><button data-guild="prepare">到准备页调整战术 →</button></div><p id="guild-feedback" role="status">${esc(message||'选择一个面板管理队伍。出征使用公会实际装备与训练。')}</p></div>${campCycleView(campObjective(g))}${expeditionBookView(g,bookRoute||getConfig().expedition)}<nav class="guild-tabs" aria-label="公会面板">${Object.entries(paneNames).map(([key,label])=>`<button data-guild-tab="${key}">${label}${key==='equipment'?' · '+Object.values(g.warehouse).reduce((a,b)=>a+b,0):''}</button>`).join('')}</nav>
 ${commandHome(g,rosterConfig(g,getConfig()),previews,companionRoom)}${rosterHome(g,{selections:replacementSelections,trial:replacementTrialState()})}
 <section class="guild-panel journey-books" data-guild-pane="journey"><h2>旅程手记</h2><p>选择一段故事查看；两段旅程分别记录结局与一次奖励。</p><div class="bar">${Object.entries(journeyNames).map(([id,label])=>`<button data-journey-book="${id}" aria-pressed="${journeyBook===id}">${label}</button>`).join('')}</div></section>${journeyBook==='harbor'?harborStoryView(g):foundryStoryView(g)}${foundryContracts(g)}${harborContracts(g)}<section class="guild-panel" data-guild-pane="contracts">${shoalsAtlasView(g,{selected:shoalsChartId(getConfig())})}</section>
 ${pending?`<section class="guild-panel"><h2>第 ${g.pending.id} 次远征待结算</h2><p>通过 ${pending.cleared} 场 · ${pending.gold} 金币 · 每位出战者 ${pending.xp} 经验。刷新页面仍可恢复。</p><p>${pending.firstClear?'首次通关加成已计入。':''}${pending.loot?.length?'装备：'+lootLabel(pending.loot):'本次无装备掉落。'}</p>${pending.foundry?`<p class=foundry-pending>铸库本次新达成：${pending.foundry.earned.map(id=>FOUNDRY_OBJECTIVES[id].name).join('、')||'无'}；额外${pending.foundry.gold}金币与定向遗物已计入上方总计，领取后才记为完成。已完成委托不会重复发奖。</p>`:''}${pending.harbor?`<p>海图 +${pending.harbor.charts}；新达成委托：${pending.harbor.earned.map(id=>HARBOR_OBJECTIVES[id].name).join("、")||"无"}（委托金币已计入上方总额）。</p>`:""}${objectiveResultView(pendingReport(g))}<button data-guild="report">查看本次战报</button><button class="primary" data-guild="claim">领取奖励并归营</button></section>`:''}
 <section class="guild-panel departure-check" data-guild-pane="departure" id="departure-check"><p class="eyebrow">出发前 / 公会实际配置</p><h2>${esc(EXPEDITIONS[getConfig().expedition].name)} · 六人出征核对</h2><label>查看指令与站位 <select id="check-scope"><option value="">默认与全路线提醒</option>${roomsFor(getConfig()).map(r=>`<option value="${r.id}" ${checkScope===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select></label><p>下方装备与训练就是本次公会出征所用值。战术来自准备页，房间覆盖可切换查看。检查不预测胜负或资源能否撑到末场。</p>${ready.config.expedition==='harbor'?`<p class="ready-harbor">港口计划：${HARBOR_DIFFICULTY[harborDifficulty(ready.config)]} / ${HARBOR_PASS[ready.config.harbor.pass]} / ${HARBOR_TASK[ready.config.harbor.task]} / ${HARBOR_RESERVE[harborReserve(ready.config)]}。抵达时按实际存活者与剩余物资结算；整段远征不暂停改配。</p>`:''}${ready.config.expedition==='foundry'?`<p class="ready-foundry">第二场通路：${FOUNDRY_APPROACHES[foundryApproach(ready.config)]}。${foundryApproach(ready.config)==='adaptive'?FOUNDRY_PASSAGE_RULE:foundryApproach(ready.config)==='channel'?'抵达时支付2符纸，不足则走风箱回廊。':'无通路费用。'}两条通路共用本房指令，整段自动执行。${ready.config.foundryFlow==='cooling-1'?'实际走潮渠会让末房护炉师把屏障从监工转向左翼自己；无额外费用。':''}</p>`:''}${ready.config.expedition==='courier'?`<p class=ready-courier>第二场通路：${COURIER_PASSES[courierPass(ready.config)]}。${courierPass(ready.config)==='keel'?'抵达时花2箭矢，不足走分舱；实际船底通路使末房节拍从前排转给后排医师。':'无通路费用，保留原末房鼓令。'}两路共用第二场指令，整段自动执行。</p>`:''}${ready.config.expedition==='shoals'?`<p class=ready-shoals>固定海图 ${shoalsChartId(ready.config)} / 12：${roomsFor(ready.config).map(r=>esc(r.name)).join(' → ')}。正常出征只分配检定种子，海图不会随出征次数变化；每图没有额外首通奖励。</p>`:''}${cooperationView(ready.cooperation,{actual:true})}<div class="ready-grid">${ready.heroes.map(h=>`<article class="ready-hero"><p class="eyebrow">${h.role} · ${POS[h.plan.pos]}</p><h3>${h.name} · ${commandLabel(g,h.id)}</h3><p>${h.gearName} · 生命${h.hp} / 法力${h.mp}</p><p>永久训练 · 累计投入 ${trainingInvestment(h.training)}经验：${Object.entries(h.training).filter(([,n])=>n>0).map(([k,n])=>`${esc(trainingOptions(h.id)[k].name)}+${n}`).join('、')||'未分配'}</p>${h.gearChanged||h.trainingChanged?`<p class="ready-diff">准备页${h.gearChanged?`装备为${h.draftGearName}`:''}${h.gearChanged&&h.trainingChanged?'，':''}${h.trainingChanged?'训练配置不同':''}；出征以本卡公会资产为准。</p>`:''}<p>后期进阶：${h.advancement?ADVANCEMENTS[h.advancement].name:'未选择'}</p><p>专修 ${SKILLS[h.trained].name} · ${DEFENSES[h.defenseFocus].name} / ${ATTR[h.attribute]}</p><p>防御 ${Object.values(h.plan.defenses).map(k=>DEFENSES[k].name).join(' / ')}</p><p>道具 ${ITEMS[h.item].name} · ${h.plan.itemPolicy.enabled?'自动使用':'停用'}${h.plan.healing.enabled?`<br>救护 ≤${Math.round(h.plan.healing.threshold*100)}% · ${h.plan.healing.priority==='self_first'?'优先自保':'最低生命比例'} · ${POS[h.plan.healing.target]||{all:'全队',self:'自身'}[h.plan.healing.target]}`:''}</p><p><b>预备</b> ${h.plan.prep.map(r=>`${SKILLS[r.skill].name}${mediumLabel(r)}${stockFloorLabel(r)}${scheduleLabel(r)}${r.medium?'（'+commandCostText({...h.plan,id:h.id,advancement:h.advancement},r)+'）':''} → ${POS[r.target]||{self:'自身',all:'全队',healer:'治疗者',summoner:'召唤者'}[r.target]}（${{round:'每回合一次',repeat:'持续',once:'一次',cycle:'轮转'}[r.mode]}）`).join('；')||'无'}</p><p><b>普通</b> ${h.plan.main.map(r=>`${SKILLS[r.skill].name}${mediumLabel(r)}${stockFloorLabel(r)}${scheduleLabel(r)}${r.medium?'（'+commandCostText({...h.plan,id:h.id,advancement:h.advancement},r)+'）':''} → ${POS[r.target]||{self:'自身',all:'全队',healer:'治疗者',summoner:'召唤者'}[r.target]}（${{round:'每回合一次',repeat:'持续',once:'一次',cycle:'轮转'}[r.mode]}）`).join('；')||'无'}</p>${initialTargetWarningsView(h.targetWarnings)}${h.warnings.length?`<ul class="ready-warnings">${h.warnings.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}<button data-ready-edit="${h.id}">调整此人战术</button><button data-ready-member="${h.id}">装备与成长</button></article>`).join('')}</div>${ready.errors.length?`<div class="ready-errors">${ready.errors.map(e=>`<p>${HEROES.find(h=>h.id===e.id).name}：${esc(e.text)}</p>`).join('')}</div>`:''}<p>${ready.pending?'上次远征尚未结算，请先领取奖励。':ready.errors.length?'请处理未学习技能后再出征。':'可出征。装备与资源提醒不会自动改动指令。'}</p><button data-guild="depart" class="primary" ${ready.canDepart?'':'disabled'}>以以上公会配置出征 →</button></section>
 ${['seasoned','veteran'].includes(getConfig().expedition)?`<section class="guild-panel" data-guild-pane="departure"><h2>阶段建议</h2><p>本路线建议${getConfig().expedition==='seasoned'?'熟练':'资深'}阶段。当前队伍最低阶段 ${Math.min(...g.members.map(h=>growth(h).level))} / 3。阶段只开放技能学习与训练，不直接增加属性，也不限制出征。</p><p>请在准备页查看敌方位置、抗性和职责；可对比正面突破、统一集火、分工保护三套方案。</p></section>`:''}
 <section class="guild-panel" data-guild-pane="departure"><h2>本次路线奖励 · ${esc(EXPEDITIONS[getConfig().expedition].name)}</h2><p>${rewardPreview(getConfig().expedition)}</p><p>${g.clears[getConfig().expedition]?`已通关 ${g.clears[getConfig().expedition]} 次`:'本版首次通关奖励尚未领取'}。装备分配到个人后永久持有；仓库重复装备可出售。</p></section>

 <section class="guild-panel" data-guild-pane="team"><h2>常驻队员</h2><div class="bar">${HEROES.filter(h=>g.members.some(m=>m.id===h.id)).map(h=>`<button data-member="${h.id}" class="${h.id===selected?'active':''}">${h.name}</button>`).join('')}</div><h3>${hero.name} · ${hero.role}</h3><p>可用经验 ${m.xp} · 永久训练投入 ${trainingInvestment(m.training)}经验 · 当前装备 ${equipmentName(m.gear)}</p>${experienceView(m)}<section class="growth-card"><p class="eyebrow">职业课程 · ${PROGRESSION_RULES.stages.find(s=>s.level===progress.level).name} / 阶段 ${progress.level}</p><h3>${SKILLS[advanced].name}</h3><p>${SKILLS[advanced].desc}</p><p>累计经验 ${progress.earned}${progress.next?` / 下一阶段 ${progress.next}`:' · 已达到当前阶段上限'}。累计值包含已用于训练、课程与后期进阶的经验，重修不改变成长阶段。</p><p>${COURSE_REQUIRED_XP}累计经验：可花${UNLOCK_COST}经验学习本职业高阶普通技能；${PROGRESSION_RULES.stages.at(-1).earned}累计经验：高阶普通技能训练上限从${PROGRESSION_RULES.stages[1].advancedRank}级提升至${MAX_TRAINING_RANK}级。各技能自由培养，按逐级经验成本投入。</p><button data-unlock="${m.id}" ${g.pending||learned||progress.level<PROGRESSION_RULES.course.requiredStage||m.xp<UNLOCK_COST?'disabled':''}>${learned?'已永久学习':'学习 · '+UNLOCK_COST+'经验'}</button><button data-install="${advanced}" ${!learned?'disabled':''}>加入当前${SKILLS[advanced].kind==='buff'?'预备':'普通'}指令</button><small>加入时置于首条，清除该角色同阶段房间覆盖；其余指令保留，满4条时请先腾出位置。</small></section><details class=advancement-card><summary>独立后期职业进阶 · ${advancement.selected?ADVANCEMENTS[advancement.selected].name:'未选择'}</summary><p>本项目门槛：累计${ADVANCEMENT_REQUIRED_XP}经验、公会通关资深试炼，选择消耗${ADVANCEMENT_COST}经验。普通技能、已学课程与训练保留，不互斥；当前重选先退回原进阶，精确返还${ADVANCEMENT_COST}经验。</p>${advancement.options.length?`${advancement.reasons.length?`<p class=ready-diff>${esc(advancement.reasons.join('；'))}</p>`:''}<div class=advancement-options>${advancement.options.map(([key,a])=>`<article><h4>${a.name}</h4><p>${a.desc}</p><button data-advancement="${key}" ${!advancement.allowed?'disabled':''}>选择 · ${ADVANCEMENT_COST}经验</button></article>`).join('')}</div><button data-reset-advancement="${m.id}" ${g.pending||!m.advancement?'disabled':''}>退回进阶 · ${ADVANCEMENT_COST}经验</button>`:'<p>该职业的后期进阶尚未开放，普通技能仍可自由培养。</p>'}</details><p>本职业普通技能可自由搭配培养。每项训练最高${MAX_TRAINING_RANK}级，逐级花费${trainingCostText}经验，可单独退回一级并返还该级实际投入；整项累计${trainingTotalText}经验。固定效果不因技能等级自动增强。</p><div class="training-grid">${Object.entries(trainingOptions(m.id)).filter(([,o])=>!isAdvanced(o.id)||m.unlocked.includes(o.id)).map(([key,o])=>{const q=trainingQuote(m,key),down=trainingQuote(m,key,-1);return `<article class="training-row"><div><b>${o.name}</b><p>永久训练 +${q.rank} · 已投入 ${q.invested}经验</p>${q.allowed?'':`<small>${esc(q.reasons.join('；'))}</small>`}</div><div><button data-learn="${key}" ${g.pending||!q.allowed?'disabled':''}>${q.rank===MAX_TRAINING_RANK?'已满级':`训练 · ${q.cost}经验`}</button><button data-untrain="${key}" ${g.pending||!down.allowed?'disabled':''}>退回一级 · ${down.refund}经验</button></div></article>`;}).join('')}</div>${trainingPlanView(m,plan,Boolean(g.pending),Boolean(draft),g.lineup.includes(selected))}${trainingRehearsalView(rehearsal)}<button data-guild="retrain" ${g.pending||!trainingCost(m.training)?'disabled':''}>重修训练（全额返还经验）</button><button data-guild-tab="equipment">查看此人装备 →</button></section>${equipmentPanel(g,selected,gearFilter,equipmentSlot,ready.config?.heroes.find(h=>h.id===selected)||getConfig().heroes.find(h=>h.id===selected)||m.tactics)}
 <section class="guild-panel" data-guild-pane="history"><h2>远征履历</h2><p>保留最近20次结算与出征方案。按当前规则重演，不发放奖励；规则更新后重演结果可能与历史结算不同。</p>${g.history.length?g.history.map(r=>`<p>第${r.id}次 · ${esc(EXPEDITIONS[r.route]?.name||r.route)} · ${r.won?'通关':'止步'} · ${r.cleared}场 · ${r.gold}金币 / 每位出战者${r.xp}经验 ${r.firstClear?'· 首通':''} ${(r.loot||[]).map(k=>esc(GEAR[k]?.name||k)).join('、')}</p>${r.config?`<div class="bar"><button data-history-compare="${r.id}">对比当前方案</button><button data-history-report="${r.id}">重演第${r.id}次远征</button><button data-history-load="${r.id}">载入第${r.id}次方案</button><small>种子 ${r.config.seed} · 当时装备与训练快照</small></div>`:'<small>此记录没有保存出征方案</small>'}`).join(''):'<p>还没有已结算远征。建议从回声侧廊或基础修道院开始。</p>'}<h3>本机存档</h3><p>公会保存在当前浏览器，暂不跨设备同步。导入备份会替换当前公会；实验战斗不发奖励。</p><button data-guild="backup">导出公会备份</button><label class="guild-import">恢复备份 <input type="file" id="guild-import" accept="application/json,.json"></label></section>${comparisonHTML()}`;
 panels();
 }
 root.onclick=e=>{const b=e.target.closest('button');if(!b)return;try{
 if(b.dataset.setSave){const slot=Number(b.dataset.setSave),name=root.querySelector(`[data-set-name="${slot}"]`).value;save(saveEquipmentSet(g,selected,slot,name));inform('当前三部位已存入此人的配装栏；没有更换或购买装备。');render();return;}
 if(b.dataset.setApply){save(applyEquipmentSet(g,selected,Number(b.dataset.setApply)));inform('已应用此人整套已持有装备，请核对技能装备条件；训练与职责保留。');render();return;}
 if(b.dataset.setDelete){save(deleteEquipmentSet(g,selected,Number(b.dataset.setDelete)));inform('已删除配装栏，实际装备保留。');render();return;}

 if(b.dataset.goalPrepare){const [route,goal]=b.dataset.goalPrepare.split(':'),c=withObjective(adventureConfig(route),goal);c.seed=getConfig().seed;loadConfig(c,undefined,false,{overview:true});inform('目标与路线已选定；请按实际队伍调整战术后正式挑战。');return;}
 if(b.dataset.goalReport){const [route,goal]=b.dataset.goalReport.split(':');showReport(bookReport(g,route,goal),bookOrigin(g,route,goal));return;}
 if(b.dataset.goalLoad){const [route,goal]=b.dataset.goalLoad.split(':');loadConfig(structuredClone(bookProof(g,route,goal).config));inform('首次方案已载入供调整；当前资产、队伍、本人及已应用职责保留。');return;}

 if(b.dataset.cycleAction){cycle(b.dataset.cycleAction,b.dataset.cycleValue||'');return;}
 else if(b.dataset.journeyBook){if(!Object.hasOwn(journeyNames,b.dataset.journeyBook))throw Error('旅程无效');journeyBook=b.dataset.journeyBook;render();return;}
 else if(b.dataset.harborStoryEnd){save(claimHarborStory(g,b.dataset.harborStoryEnd));inform('来信结局已记录；40金币与指定装备已入公会仓库，可前往分配。');render();return;}
 else if(b.dataset.foundryStoryEnd){const ending=b.dataset.foundryStoryEnd;save(claimFoundryStory(g,ending));inform('归航结局已记录；40金币与指定装备已入公会仓库，可前往分配。');render();return;}
 else if(b.dataset.shoalsChart){const c=shoalsConfig('roles',Number(b.dataset.shoalsChart));c.seed=getConfig().seed;loadConfig(c);inform('已准备指定海图；成员资产与伙伴职责保留，通关领取后才记入勘探册。');return;}
 else if(b.dataset.journeyPrepare){const route=b.dataset.journeyPrepare;if(!['foundry','foundrywatch','chapter','harbor','courier'].includes(route))throw Error('旅程路线无效');const c=({foundry:foundryConfig,foundrywatch:watchConfig,courier:courierConfig,chapter:chapterConfig,harbor:harborConfig}[route])();c.seed=getConfig().seed;loadConfig(c);inform('旅程路线已准备；当前公会资产与已应用伙伴职责保留，完成后正常领取结算。');return;}
 else if(b.dataset.foundryPrepare){const c=foundryConfig();c.seed=getConfig().seed;loadConfig(c);inform('铸库已准备；委托在正常出征结算时核对，当前尚未支付或领取奖励。');return;}
 else if(b.dataset.rosterRehearse){if(localStorage.getItem(GUILD_KEY)!==raw)throw Error('另一页面已修改公会，请重新进入公会后再试演');const incoming=b.dataset.rosterRehearse,outgoing=root.querySelector('#replace-'+incoming)?.value;if(!outgoing)throw Error('请先选择替换伙伴');replacementSelections[incoming]=outgoing;replacementTrial=rehearseReplacement(g,getConfig(),outgoing,incoming);inform('两套实际队伍试演完成，没有换人、出征或发奖；正式编入仍由你选择。');render();const panel=root.querySelector('.roster-rehearsal');if(panel){panel.style.scrollMarginTop=((root.querySelector('.guild-tabs')?.getBoundingClientRect().height||0)+12)+'px';panel.scrollIntoView({block:'start'});}return;}
 else if(b.dataset.rosterReport){if(localStorage.getItem(GUILD_KEY)!==raw)throw Error('另一页面已修改公会，请重新进入公会后再查看试演');const trial=replacementTrialState(),key=b.dataset.rosterReport;if(!trial||trial.stale||!['before','after'].includes(key))throw Error('换人试演已过期，请重新试演');showReport(structuredClone(trial.value.reports[key]),{rehearsal:true,label:key==='before'?'当前队伍':'换人后队伍',note:'换人仍需在名册中明确编入。'});inform('正在查看换人试演战报；未出征、未换人、未发奖。');return;}
 else if(b.dataset.recruit){save(recruit(g,b.dataset.recruit));inform('新伙伴已加入候补名册，尚未替换出战队员。');render();return;}
 else if(b.dataset.swap){const out=root.querySelector('#replace-'+b.dataset.swap).value;save(swapCompanion(g,getConfig(),out,b.dataset.swap));updateConfig(rosterConfig(g,getConfig()));previews={};replacementTrial=null;inform('出战伙伴已替换；原伙伴的装备、经验和战术仍保留。');render();return;}
 else if(b.dataset.applyCompanion){const id=b.dataset.applyCompanion;save(setCompanion(g,id,previews[id]));delete previews[id];inform('伙伴职责已应用；出征核对将使用此职责。');render();return;}
 else if(b.dataset.cancelCompanion){delete previews[b.dataset.cancelCompanion];render();return;}
 else if(b.dataset.ownHero){previews={};save(selectHero(g,b.dataset.ownHero));selected=b.dataset.ownHero;inform('已选择自己的英雄；伙伴职责可在下方设置。');render();return;}
 else if(b.dataset.personal){selected=g.command.heroId;if(b.dataset.personal==='tactics'){updateConfig(rosterConfig(g,getConfig()));editHero(selected,'');return;}switchPanel(b.dataset.personal==='growth'?'team':'equipment');return;}
 else if(b.dataset.reuseOpen){reuseOpen=true;reuseSource='';reuseTarget='';reuseRooms=false;render();root.querySelector('.tactic-reuse')?.scrollIntoView({block:'start'});return;}
 else if(b.dataset.reuseClose){reuseOpen=false;lastReusePreview=null;render();return;}
 else if(b.dataset.reuseApply){if(!lastReusePreview||!reuseOpen)throw Error('请先预览单人战术');const request=lastReusePreview,result=reuseHistoryTactic(g,getConfig(),request);applyTacticEdit(result,loadConfig);reuseOpen=false;lastReusePreview=null;editHero(request.targetId,'');inform('历史单人战术已应用到'+request.targetName+'，当前装备、培养、后期选择和经验保留；可在方案管理撤销配置与本次伙伴职责变化。');return;}
 else if(b.dataset.historyCompare){compareId=Number(b.dataset.historyCompare);reuseOpen=false;lastReusePreview=null;render();root.querySelector('#history-comparison')?.scrollIntoView({block:'start'});return;}
 else if(b.dataset.historyClose){compareId=null;render();root.querySelector('.guild-tabs')?.scrollIntoView({block:'start'});return;}
 else if(b.dataset.historyReport){showReport(historyReport(g,Number(b.dataset.historyReport)),{source:'history',id:Number(b.dataset.historyReport)});inform('正在按当前规则重演第'+b.dataset.historyReport+'次远征，不发放奖励。');return;}
 else if(b.dataset.historyLoad){loadConfig(historyConfig(g,Number(b.dataset.historyLoad)));inform('历史出征方案已载入，可撤销。再次公会出征使用当前装备与训练，并采用新的出征种子。');return;}
 else if(b.dataset.guildTab){switchPanel(b.dataset.guildTab);return;}
 else if(b.dataset.member)selected=b.dataset.member;
 else if(b.dataset.cooperationEdit){const id=b.dataset.cooperationEdit,room=b.dataset.cooperationRoom,edit=customizeForEditing(g,getConfig(),id,room);delete previews[id];applyTacticEdit(edit,updateConfig);editHero(id,room,b.dataset.cooperationRow,b.dataset.cooperationPhase||'prep');inform('已保留当前实际职责指令并切到自定义，可从本房继续修改；方案管理可撤销配置与本次职责变化。');return;}
 else if(b.dataset.readyEdit){const id=b.dataset.readyEdit,edit=customizeForEditing(g,getConfig(),id,checkScope);delete previews[id];applyTacticEdit(edit,updateConfig);editHero(id,checkScope);inform('已保留当前实际职责指令；该队员现使用自定义，可逐房调整；方案管理可撤销配置与本次职责变化。');return;}
 else if(b.dataset.readyMember){selected=b.dataset.readyMember;switchPanel("team");return;}
 else if(b.dataset.advancement){save(chooseAdvancement(g,selected,b.dataset.advancement));inform('已选择后期职业进阶，普通技能和训练保留。');}
 else if(b.dataset.resetAdvancement){save(resetAdvancement(g,b.dataset.resetAdvancement));inform('已退回后期进阶并返还'+ADVANCEMENT_COST+'经验；普通技能和训练保留。');}
 else if(b.dataset.unlock)save(learnAdvanced(g,b.dataset.unlock));
 else if(b.dataset.install){const edit=customizeForEditing(g,getConfig(),selected),installed=installAdvanced(edit.config,selected,b.dataset.install);delete previews[selected];applyTacticEdit({...edit,config:installed},loadConfig);inform("已保留实际职责并加入高阶普通技能；伙伴现为自定义，该阶段逐房指令覆盖已清除。请核对目标、资源与行动顺序；可撤销配置与本次职责变化。");return;}
 else if(b.dataset.assign){save(assignLoot(g,selected,b.dataset.assign));inform("战利品已分配并装备，可在已持有装备中查看。");}
 else if(b.dataset.sell)save(sellLoot(g,b.dataset.sell));
 else if(b.dataset.learn)save(train(g,selected,b.dataset.learn));
 else if(b.dataset.trainingReport){if(localStorage.getItem(GUILD_KEY)!==raw)throw Error('另一页面已修改公会，请重新进入公会后再查看试演');const draft=trainingDrafts[selected],trial=trainingRehearsals[selected];if(!draft||!trial||trial.signature!==rehearsalSignature(quoteTrainingPlan(g.members.find(m=>m.id===selected),draft.target,{expected:draft.expected})))throw Error('试演已过期，请重新试演');if(!['before','after'].includes(b.dataset.trainingReport))throw Error('试演战报无效');showReport(structuredClone(trial.value.reports[b.dataset.trainingReport]),{rehearsal:true,label:b.dataset.trainingReport==='before'?'当前培养':'培养草案'});inform('正在查看'+(b.dataset.trainingReport==='before'?'当前培养':'培养草案')+'试演战报；没有出征或支付，尚未应用草案。');return;}
 else if(b.dataset.planAction==='rehearse'){if(localStorage.getItem(GUILD_KEY)!==raw)throw Error('另一页面已修改公会，请重新进入公会后再试演');const draft=trainingDrafts[selected];if(!draft)throw Error('请先规划培养调整');const plan=quoteTrainingPlan(g.members.find(m=>m.id===selected),draft.target,{expected:draft.expected}),value=rehearseTrainingPlan(g,getConfig(),selected,plan);trainingRehearsals[selected]={signature:rehearsalSignature(plan),value};inform('当前与草案试演完成，未改公会资产或履历。');render();root.querySelector('.training-rehearsal')?.scrollIntoView({block:'start'});return;}
 else if(b.dataset.planAction){if(b.dataset.planAction==='restart'){delete trainingDrafts[selected];}else{const draft=trainingDrafts[selected];if(!draft)throw Error('请先规划培养调整');const q=quoteTrainingPlan(g.members.find(m=>m.id===selected),draft.target,{expected:draft.expected});save(applyTrainingPlan(g,selected,q));delete trainingDrafts[selected];inform('培养草案已应用：退回'+q.refund+'经验，花费'+q.cost+'经验；普通课程和进阶保留。');}}
 else if(b.dataset.untrain){const key=b.dataset.untrain,q=trainingQuote(g.members.find(m=>m.id===selected),key,-1);save(lowerTraining(g,selected,key));inform('已退回'+q.name+'一级，返还'+q.refund+'经验；其他训练和已学技能保留。');}
 else if(b.dataset.equipmentSlot){equipmentSlot=b.dataset.equipmentSlot;gearFilter='all';}
 else if(b.dataset.harborRedeem){save(redeemHarbor(g,b.dataset.harborRedeem));inform('海图已兑换，装备进入公会仓库，可在装备与仓库分配。');}
 else if(b.dataset.equip){save(equip(g,selected,b.dataset.equip));inform("已为"+HEROES.find(h=>h.id===selected).name+"装备"+GEAR[b.dataset.equip].name+"。原装备保留在个人库。");}
 else switch(b.dataset.guild){
 case 'check':switchPanel('departure');return;
 case 'backup':download('sunken-abbey-guild.json',g||{unreadable:raw});return;
 case 'prepare':loadConfig(guildConfig(g,getConfig()));inform('公会装备与永久训练已载入。修改指令后请使用“公会出征”；实验配置中的装备与训练不会覆盖公会资产。');return;
 case 'depart':save(depart(g,getConfig()));showReport(pendingReport(g),pendingOrigin(g));inform('公会远征已记录。请返回公会领取奖励；刷新后可恢复战报与待结算状态。');break;
 case 'report':showReport(pendingReport(g),pendingOrigin(g));break;
 case 'claim':{const hasLoot=(pendingReward(g).loot||[]).length>0;save(claim(g));selected=g.command?.heroId||selected;pane=hasLoot?'equipment':'team';}inform('奖励已存入公会，出战者已获得经验；候补保留原成长，装备和训练保留。');break;
 case 'retrain':save(retrain(g,selected));break;
 }render();}catch(e){inform(e.message);}};
 root.onchange=async e=>{if(e.target.id==='book-route'){bookRoute=e.target.value;render();return;}if(['reuse-source','reuse-target','reuse-rooms'].includes(e.target.id)){if(e.target.id==='reuse-source'){reuseSource=e.target.value;reuseTarget='';}else if(e.target.id==='reuse-target')reuseTarget=e.target.value;else reuseRooms=e.target.checked;render();root.querySelector('.tactic-reuse')?.scrollIntoView({block:'start'});return;}if(e.target.dataset.replacementChoice){replacementSelections[e.target.dataset.replacementChoice]=e.target.value;render();return;}if(e.target.dataset.trainingTarget){const m=g.members.find(m=>m.id===selected),draft=trainingDrafts[selected]||{expected:trainingSnapshot(m),target:{...m.training}},key=e.target.dataset.trainingTarget,rank=Number(e.target.value);if(rank)draft.target[key]=rank;else delete draft.target[key];trainingDrafts[selected]=draft;render();root.querySelector('.training-plan').open=true;return;}if(e.target.id==='companion-room'){companionRoom=e.target.value;render();return;}if(e.target.dataset.companion){previews[e.target.dataset.companion]=e.target.value;inform('正在预览，点击应用此职责后才会用于出征。');render();return;}if(e.target.id==='history-compare-mode'){compareMode=e.target.value;render();root.querySelector('#history-comparison')?.scrollIntoView({block:'start'});return;}if(e.target.id==='equipment-slot'){equipmentSlot=e.target.value;render();return;}if(e.target.id==='gear-filter'){gearFilter=e.target.value;render();return;}if(e.target.id==='check-scope'){checkScope=e.target.value;render();return;}if(['loot-member','gear-member'].includes(e.target.id)){selected=e.target.value;render();return;}if(e.target.id!=='guild-import')return;try{const file=e.target.files[0];if(!file)return;if(file.size>2e6)throw Error('备份文件过大');const next=migrateGuild(JSON.parse(await file.text()));if(!confirm('恢复备份将替换当前公会。建议先导出当前备份。继续？'))return;save(next);render();inform('公会备份已恢复。');}catch(e){inform('无法恢复：'+e.message);}};
 function open(next='hero',book){if(Object.hasOwn(journeyNames,book))journeyBook=book;pane=typeof next==='string'?next:'hero';read();render();view('guild');window.scrollTo({top:0});}
 document.querySelector('header [data-view="guild"]').onclick=open;
 document.querySelector('#guild-run').onclick=()=>{open('departure');root.querySelector('.guild-tabs')?.scrollIntoView({block:'start'});};
 function cycle(action,value=''){read();if(!g)throw Error('公会暂不可用，请先检查或恢复备份');
  if(action==='prepare'){const c=adventureConfig(value);c.seed=getConfig().seed;loadConfig(c,undefined,false,{overview:true});inform('已准备现有路线；请核对实际公会队伍后正式出征，实验不发成长奖励。');}
  else if(action==='retry'){loadConfig(historyConfig(g,Number(value)));inform('已载入止步时方案供检查；再次出征使用当前公会资产，不自动保证通关。');}
  else if(action==='pending'){if(!g.pending){open('departure');return;}showReport(pendingReport(g),pendingOrigin(g));}
  else if(action==='training'||action==='equipment'){selected=g.command?.heroId||selected;open(action==='training'?'team':'equipment');}
  else if(action==='goals'){bookRoute=getConfig().expedition;open('goals');}else if(action==='hero')open('hero');else if(action==='official')open('departure');else if(action==='journey'){if(!Object.hasOwn(journeyNames,value))throw Error('旅程无效');open('journey',value);}
  else if(action==='map')view('adventure');else if(action==='camp')open('hero');else throw Error('营地操作无效');
 }
 function settleReport(origin,report){read();if(!g)throw Error('公会暂不可用，原存档未覆盖');const next=claimReport(g,origin,report),loot=next.history[0].loot||[];save(next);selected=g.command?.heroId||selected;pane=loot.length?'equipment':'team';inform('本次收益已正式到账。现在可分配装备、培养自己的英雄，或继续营地目标。');render();view('guild');window.scrollTo({top:0});}
 read();render();return {open,cycle,settleReport,currentSnapshot:()=>readCycleGuild(localStorage),undoConfiguration,renderDraftBridge,snapshot:()=>g?structuredClone(g):null,heroId:()=>g?.command?.heroId||null};
}
