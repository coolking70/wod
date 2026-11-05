import {validateExpeditionBook,validateObjectiveRecord,objectiveAssessment,recordExpeditionObjective} from './expedition-book.mjs';
import {validateShoalsState,recordShoals} from './expedition-shoals.mjs';
import {validateHarborStory,harborStoryProgress,HARBOR_STORY_ENDINGS,HARBOR_STORY_GOLD} from './expedition-harbor-story.mjs';
import {quoteTrainingPlan} from './expedition-training-plan.mjs';
import {PROGRESSION_RULES,COURSE_REQUIRED_XP} from './expedition-progression-rules.mjs';
import {HARBOR_OBJECTIVES,HARBOR_EXCHANGE,harborReward} from './expedition-harbor-contract.mjs';
import {validateFoundryState,foundryReward} from './expedition-foundry-contract.mjs';
import {validEquipment,sameEquipment,replaceEquipment} from './expedition-equipment.mjs';
import {newMember,validateRoster} from './expedition-roster.mjs';
import {validateCommand,commandConfig} from './expedition-command.mjs';
import {ADVANCED,UNLOCK_COST,isAdvanced,growth,assertGuildSkills} from './expedition-growth.mjs';
import {ADVANCEMENT_COST,advancementOptions,applyAdvancementAsset} from './expedition-advancement-data.mjs';
import {advancementStatus,validMemberAdvancement} from './expedition-advancement.mjs';
import {trainingQuote,trainingInvestment} from './expedition-training.mjs';
import {ROUTE_REWARDS,expeditionReward,isRelic} from './expedition-loot.mjs';
import {defaults,clone,HEROES,GEAR,trainingOptions,MAX_TRAINING_RANK} from './expedition-data.mjs';
import {validateFoundryStory,foundryStoryProgress,FOUNDRY_STORY_ENDINGS,FOUNDRY_STORY_GOLD} from './expedition-foundry-story.mjs';
import {validate,simulate} from './expedition-engine.mjs';
export const GUILD_KEY='abbey-guild-v6';
export const GEAR_PRICE=60;
export function newGuild(){return {version:6,harbor:{charts:0,claimed:[]},lineup:defaults().heroes.map(h=>h.id),warehouse:{},clears:{},gold:0,next:1,members:defaults().heroes.map(h=>newMember(h.id)),pending:null,history:[]};}
const integer=n=>Number.isSafeInteger(n)&&n>=0;
export function validateGuild(g){
 validateCommand(g?.command);
 validateFoundryState(g?.foundry);
 validateFoundryStory(g?.foundryStory);validateHarborStory(g?.harborStory);
 if(!g||g.version!==6||!integer(g.gold)||!integer(g.next)||g.next<1||!Array.isArray(g.members)||g.members.length<6||g.members.length>HEROES.length||new Set(g.members.map(h=>h.id)).size!==g.members.length)throw Error('公会存档格式无效');
 if(!g.harbor||!integer(g.harbor.charts)||!Array.isArray(g.harbor.claimed)||new Set(g.harbor.claimed).size!==g.harbor.claimed.length||g.harbor.claimed.some(id=>!Object.hasOwn(HARBOR_OBJECTIVES,id)))throw Error('港口委托存档无效');
 validateRoster(g);
 for(const m of g.members){if(!m.tactics||m.tactics.id!==m.id)throw Error('个人战术归属无效');const c=defaults(),i=c.heroes.findIndex(h=>h.id===m.id),slot=i<0?0:i,old=c.heroes[slot].id;c.heroes[slot]=clone(m.tactics);c.prepOrder=c.prepOrder.map(id=>id===old?m.id:id);validate(c);}
 for(const h of g.members){if(!validMemberAdvancement(g,h))throw Error('后期职业进阶数据无效');if(!HEROES.some(t=>t.id===h.id)||!integer(h.xp)||!Array.isArray(h.owned)||!h.owned.length||new Set(h.owned).size!==h.owned.length||h.owned.some(k=>!Object.hasOwn(GEAR,k))||(!validEquipment(h.gear)||Object.values(h.gear).some(k=>!h.owned.includes(k)))||!h.training||Array.isArray(h.training)||Object.entries(h.training).some(([k,v])=>!Object.hasOwn(trainingOptions(h.id),k)||!integer(v)||v>MAX_TRAINING_RANK))throw Error('公会队员数据无效');if(!Array.isArray(h.unlocked)||new Set(h.unlocked).size!==h.unlocked.length||h.unlocked.some(k=>k!==ADVANCED[h.id])||(h.unlocked.length&&growth(h).level<PROGRESSION_RULES.course.requiredStage)||Object.entries(h.training).some(([k,n])=>n>0&&isAdvanced(k.slice(6))&&(!h.unlocked.includes(k.slice(6))||n>growth(h).advancedRank)))throw Error('进阶技能成长数据无效');}
 if(!Array.isArray(g.history)||g.history.length>20||g.history.some(r=>!integer(r.id)||r.id>=g.next||typeof r.route!=='string'||typeof r.won!=='boolean'||!integer(r.cleared)||!integer(r.gold)||!integer(r.xp)||(r.loot!==undefined&&(!Array.isArray(r.loot)||r.loot.some(k=>!isRelic(k))))||(r.firstClear!==undefined&&typeof r.firstClear!=="boolean"))||new Set(g.history.map(r=>r.id)).size!==g.history.length)throw Error('公会履历无效');
 for(const r of g.history){validateObjectiveRecord(r);validateCommand(r.command);if(r.config!==undefined){validate(r.config);if(r.config.expedition!==r.route)throw Error("历史远征路线与快照不一致");}}
 if(g.pending!==null){validateCommand(g.pending?.command);if(!g.pending||g.pending.id!==g.next-1||g.history.some(r=>r.id===g.pending.id))throw Error('待结算远征无效');validate(g.pending.config);for(const h of g.pending.config.heroes){const m=g.members.find(m=>m.id===h.id);if(!sameEquipment(h.gear,m.gear)||JSON.stringify(h.training)!==JSON.stringify(m.training)||(h.advancement||null)!==(m.advancement?.path||null))throw Error('远征资产快照不一致');assertGuildSkills(m,h);}}
 if(!g.warehouse||typeof g.warehouse!=="object"||Array.isArray(g.warehouse)||Object.entries(g.warehouse).some(([k,n])=>!isRelic(k)||!integer(n))||!g.clears||typeof g.clears!=="object"||Array.isArray(g.clears)||Object.entries(g.clears).some(([k,n])=>!Object.hasOwn(ROUTE_REWARDS,k)||!integer(n)))throw Error("战利品或通关记录无效");
 validateExpeditionBook(g.expeditionBook,g.next);
 validateShoalsState(g.shoals,g.clears.shoals||0);
 if(g.pending&&![1,2].includes(g.pending.rewardVersion))throw Error("结算版本无效");
 if(g.harborStory&&!harborStoryProgress(g).ready)throw Error('灯塔来信记录缺少正常远征条件');
 if(g.foundryStory&&!foundryStoryProgress(g).ready)throw Error('铸库归航记录缺少正常远征条件');
 return g;
}
export function migrateGuild(input){return validateGuild(clone(input));}
export function guildConfig(g,tactics){validateGuild(g);const c=commandConfig(g,tactics);for(const h of c.heroes){const m=g.members.find(m=>m.id===h.id);h.gear=clone(m.gear);h.training=clone(m.training);applyAdvancementAsset(h,m);assertGuildSkills(m,h);}validate(c);return c;}
export function depart(g,tactics){validateGuild(g);if(g.pending)throw Error('请先领取上次远征结算');const n=clone(g),config=guildConfig(g,tactics);config.seed=(g.next-1)%999999+1;n.pending={id:g.next,config,rewardVersion:2,...(g.command?{command:clone(g.command)}:{})};n.next++;return n;}
export function pendingReport(g){validateGuild(g);if(!g.pending)throw Error('没有待结算远征');return {...simulate(clone(g.pending.config)),...(g.pending.command?{perspective:clone(g.pending.command)}:{})};}
export function rewardFor(report){return expeditionReward(report);}
export function pendingReward(g){const report=pendingReport(g);const base=expeditionReward(report,{version:g.pending.rewardVersion,first:!(g.clears[report.config.expedition]>0),id:g.pending.id}),harbor=harborReward(report,g),foundry=foundryReward(report,g);return {...base,...(harbor?{gold:base.gold+harbor.gold,harbor}:{}),...(foundry?{gold:base.gold+foundry.gold,loot:[...(base.loot||[]),...foundry.loot],foundry}:{})};}
export function claim(g){validateGuild(g);if(!g.pending)throw Error('没有待领取奖励');const report=pendingReport(g),reward=pendingReward(g),n=clone(g);n.gold+=reward.gold;for(const h of n.members)if(g.pending.config.heroes.some(u=>u.id===h.id))h.xp+=reward.xp;
 if(reward.harbor){n.harbor.charts+=reward.harbor.charts;n.harbor.claimed.push(...reward.harbor.earned);}
 if(reward.foundry)n.foundry={claimed:[...(n.foundry?.claimed||[]),...reward.foundry.earned]};
 for(const gear of reward.loot||[])n.warehouse[gear]=(n.warehouse[gear]||0)+1;
 if(g.pending.rewardVersion===2&&report.won)n.clears[report.config.expedition]=(n.clears[report.config.expedition]||0)+1;
 if(g.pending.rewardVersion===2)recordShoals(n,report);
 const objective=objectiveAssessment(report);recordExpeditionObjective(n,report,g.pending.id,g.pending.command);
 n.history.unshift({id:g.pending.id,route:report.config.expedition,won:report.won,...reward,...(objective?{objective}:{}),config:clone(g.pending.config),...(g.pending.command?{command:clone(g.pending.command)}:{})});n.history=n.history.slice(0,20);n.pending=null;return n;}
export function assignLoot(g,id,gear){const n=editable(g),h=n.members.find(h=>h.id===id);if(!h||!isRelic(gear)||!(n.warehouse[gear]>0))throw Error('没有可分配的战利品');if(h.owned.includes(gear))throw Error('该队员已拥有此装备，可分给其他队员或出售');n.warehouse[gear]--;h.owned.push(gear);h.gear=replaceEquipment(h.gear,gear);return n;}
export function claimFoundryStory(g,ending){
 const n=editable(g),p=foundryStoryProgress(n);
 if(typeof ending!=='string'||!Object.hasOwn(FOUNDRY_STORY_ENDINGS,ending))throw Error('请选择有效的归航结局');
 if(!p.canClaim)throw Error(p.reason);
 const gear=FOUNDRY_STORY_ENDINGS[ending].gear,gold=n.gold+FOUNDRY_STORY_GOLD,count=(n.warehouse[gear]||0)+1;
 if(!Number.isSafeInteger(gold)||!Number.isSafeInteger(count))throw Error('旅程奖励超过安全计数范围');
 n.gold=gold;n.warehouse[gear]=count;n.foundryStory={ending};return validateGuild(n);
}
export function sellLoot(g,gear){const n=editable(g);if(!isRelic(gear)||!(n.warehouse[gear]>0))throw Error('仓库中没有该装备');n.warehouse[gear]--;n.gold+=20;return n;}
function editable(g){validateGuild(g);if(g.pending)throw Error('领取远征结算后才能更改公会资产');return clone(g);}
export function train(g,id,key){const n=editable(g),h=n.members.find(m=>m.id===id);if(!h)throw Error('训练项目无效');const q=trainingQuote(h,key);if(!q.allowed)throw Error(q.reasons.join('；'));h.xp-=q.cost;h.training={...h.training,[key]:q.nextRank};return n;}
export function lowerTraining(g,id,key){const n=editable(g),h=n.members.find(m=>m.id===id);if(!h)throw Error('训练项目无效');const q=trainingQuote(h,key,-1);if(!q.allowed)throw Error(q.reasons.join('；'));if(q.nextRank)h.training[key]=q.nextRank;else delete h.training[key];h.xp+=q.refund;return n;}
export function applyTrainingPlan(g,id,plan){const n=editable(g),h=n.members.find(m=>m.id===id);if(!h||typeof plan?.expected!=='string')throw Error('培养草案缺少角色或原始快照');const q=quoteTrainingPlan(h,plan.target,{expected:plan.expected});if(!q.allowed)throw Error(q.reasons.join('；'));h.xp=q.availableAfter;h.training=q.target;return validateGuild(n);}
export function equip(g,id,gear){const n=editable(g),h=n.members.find(m=>m.id===id);if(!h||!Object.hasOwn(GEAR,gear))throw Error('装备无效');if(!h.owned.includes(gear)){if(isRelic(gear))throw Error('地下城装备须从战利品仓库分配');if(n.gold<GEAR_PRICE)throw Error('公会金币不足');n.gold-=GEAR_PRICE;h.owned.push(gear);}h.gear=replaceEquipment(h.gear,gear);return n;}
export function retrain(g,id){const n=editable(g),h=n.members.find(m=>m.id===id);if(!h)throw Error('队员无效');const returned=h.xp+trainingInvestment(h.training);if(!Number.isSafeInteger(returned))throw Error('返还后经验超出安全范围');h.xp=returned;h.training={};return n;}

export function chooseAdvancement(g,id,path){const n=editable(g),h=n.members.find(m=>m.id===id),status=advancementStatus(n,id);if(!status.allowed)throw Error(status.reasons.join('；'));if(!advancementOptions(id).some(([key])=>key===path))throw Error('进阶方向不属于该职业');h.xp-=ADVANCEMENT_COST;h.advancement={path,paidXp:ADVANCEMENT_COST};return n;}
export function resetAdvancement(g,id){const n=editable(g),h=n.members.find(m=>m.id===id);if(!h?.advancement)throw Error('该角色尚未选择后期进阶');if(!Number.isSafeInteger(h.xp+ADVANCEMENT_COST))throw Error('返还后经验超出安全范围');h.xp+=ADVANCEMENT_COST;h.advancement=null;return n;}

export function learnAdvanced(g,id){const n=editable(g),h=n.members.find(m=>m.id===id),skill=ADVANCED[id];if(!h||!skill)throw Error("队员无效");if(h.unlocked.includes(skill))throw Error("技能已学习");if(growth(h).level<PROGRESSION_RULES.course.requiredStage)throw Error('累计获得'+COURSE_REQUIRED_XP+'经验后开放高阶普通技能');if(h.xp<UNLOCK_COST)throw Error('可用经验不足'+UNLOCK_COST);h.xp-=UNLOCK_COST;h.unlocked.push(skill);return n;}

// Read-only reconstruction: rewards and current guild assets are never touched.
export function historyConfig(g,id){validateGuild(g);const record=g.history.find(r=>r.id===id);if(!record?.config)throw Error('此记录没有保存出征方案');return clone(record.config);}
export function historyReport(g,id){const report=simulate(historyConfig(g,id)),command=g.history.find(r=>r.id===id)?.command;return {...report,...(command?{perspective:clone(command)}:{})};}

export function redeemHarbor(g,gear){const n=editable(g);if(!HARBOR_EXCHANGE.includes(gear))throw Error('不是港口兑换装备');if(n.harbor.charts<2)throw Error('需要2张海图');n.harbor.charts-=2;n.warehouse[gear]=(n.warehouse[gear]||0)+1;return n;}

export function claimHarborStory(g,ending){
 const n=editable(g),p=harborStoryProgress(n);
 if(typeof ending!=='string'||!Object.hasOwn(HARBOR_STORY_ENDINGS,ending))throw Error('请选择有效的来信结局');
 if(!p.canClaim)throw Error(p.reason);
 const gear=HARBOR_STORY_ENDINGS[ending].gear,gold=n.gold+HARBOR_STORY_GOLD,count=(n.warehouse[gear]||0)+1;
 if(!Number.isSafeInteger(gold)||!Number.isSafeInteger(count))throw Error('旅程奖励超过安全计数范围');
 n.gold=gold;n.warehouse[gear]=count;n.harborStory={ending};return validateGuild(n);
}
