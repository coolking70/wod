import {postQuestProgress} from './expedition-post-quest.mjs';
import {campJourneyProgress} from './expedition-camp-journeys.mjs';
import {bookProof} from './expedition-book.mjs';
import {GOALS} from './expedition-goal-data.mjs';
import {ADVENTURES} from './expedition-adventure.mjs';
import {newGuild,migrateGuild,validateGuild,pendingReward,claim,GUILD_KEY} from './expedition-guild.mjs';
import {trainingInvestment} from './expedition-training.mjs';
export const ADVENTURE_GROUPS=[
 {id:'story',title:'起步与故事',text:'从一场正式出征开始，再走向沉钟、灯塔与铸库。',routes:['tutorial','classic','chapter','harbor','foundry','foundrywatch','courier']},
 {id:'roles',title:'职责与协作',text:'按具体敌情练习拆援、净化、不同攻击类型与队伍分工。',routes:['manashield','parleyquay','markedhunt','sporegrove','pressurevault','evacuation','lockworks','trapworks','ossuary','turncourt','breakwater','counterpoint','confluence','clocktower','hospice','theater','inquest','palisade','scriptorium','greenhouse']},
 {id:'challenge',title:'成长与挑战',text:'阶段试炼、分支和资源压力；先核对当前实际队伍。',routes:['seasoned','veteran','archive','survival','vigil','scarcity']},
 {id:'explore',title:'自由勘探',text:'按公开海图勘探，或寻找套装部件，实际分配与穿戴再形成自己的组合。',routes:['shoals','beaconbridge']}
];
export function readCycleGuild(storage){const raw=storage.getItem(GUILD_KEY);return raw?migrateGuild(JSON.parse(raw)):newGuild();}
export function campObjective(g){
 validateGuild(g);const own=g.members.find(m=>m.id===g.command?.heroId),last=g.history[0]||null,cleared=ADVENTURES.filter(a=>g.clears[a.id]>0).length;
 const make=(stage,title,text,action,value,label)=>({stage,title,text,primary:{action,value,label},last,cleared,total:ADVENTURES.length,journeys:campJourneyProgress(g),heroId:own?.id||null});
 if(g.pending)return make('pending','先接回这次远征','第'+g.pending.id+'次远征已记录，奖励仍待领取；领取前不会再次出征或改变永久资产。','pending','','查看待领取战报');
 if(!own)return make('hero','选择你在队伍中的英雄','先确定自己的英雄，再以公会实际装备和训练正式出发；伙伴仍可托管。','hero','','选择我的英雄');
 if(g.postQuest&&!g.postQuest.ending){const p=postQuestProgress(g);return make(p.ready?'postquest-delivery':'postquest',p.ready?'把三段路签交给等信的人':'继续归信航程',p.reason,'journey','postquest',p.ready?'选择归信交付':'查看当前任务与通路');}
 if(last&&!last.won)return make('retry','带着这次结果重新准备','刚才领取的是止步前的实际收益。可以载入该次方案检查，再以当前资产重试；不是保证通关的自动优化。','retry',String(last.id),'载入止步方案并检查');
 if(last?.won&&last.objective&&!last.objective.met){const name=GOALS.find(goal=>goal.id===last.objective.id).name;return make('goal-retry','通关之后，再试本次「'+name+'」','第'+last.id+'次远征已通关，普通收益已经领取；本次所选攻略目标尚未达成。可载入原目标与方案调整，再按当前资产正式挑战；也可自由改选路线。','retry',String(last.id),'载入本次目标与方案');}
 if(!g.clears.tutorial)return make('tutorial','先完成一场正式远征','回声侧廊只有一场。核对公会队伍后正式出征，复盘并领取金币和经验；实验试跑不推进成长。','prepare','tutorial','准备首次正式出征');
 if(!g.clears.classic)return make('classic','把准备带进连续三场','沉没修道院练习跨房资源，通关领取后才获得装备与首通记录。其他路线仍可自由选择。','prepare','classic','准备修道院短线');
 if(!trainingInvestment(own.training)&&own.xp>=20)return make('growth','决定第一笔经验用在哪里','你已能进行普通培养。去查看本人的实际费用和收益，或直接继续探索；培养不是出征门槛。','training','','查看我的成长');
 if(!g.clears.chapter)return make('chapter','走向沉钟之下','下一段故事是六场连续远征，生命、法力和物资跨房继承；先核对敌情与真实资产，失败仍可领取已通过房间的收益。','prepare','chapter','准备第一章');
 if(!g.clears.harbor)return make('harbor','接上灯塔的来信','盐风港有四场与自动分支，战前选择、实际队伍状态和物资共同决定通路。','prepare','harbor','准备盐风港');
 if(!g.harborStory?.ending)return make('letter','把实际归航写成回信','灯塔来信复用已领取的章节、港口和委托成果，完成后再亲自选择结局；不会自动代领。','journey','harbor','继续灯塔来信');
 if(!g.foundryStory?.ending)return make('foundry','给最后一班守望交接','铸库归航串联现有地城、目标与守望。查看尚缺的一段，选择自己的归航结局。','journey','foundry','继续铸库归航');
 if(!g.clocktowerStory?.ending)return make('clocktower-story','给错过的钟声一个去处','潮刻余响连接钟楼留存与书库、温室或哨垒的全员攻略；任选一处带回自己的回答，不额外消耗永久材料。','journey','clocktower','继续潮刻余响');
 return make('explore','选择下一项探索目标','三段故事已完成。按主题浏览未通关路线、职责挑战或有限海图；没有新门槛或额外奖励。','map','','浏览全部探索');
}
export function pendingOrigin(g){validateGuild(g);if(!g.pending)throw Error('没有待结算远征');return {source:'pending',id:g.pending.id,signature:JSON.stringify(g.pending)};}
const matches=(record,report)=>record&&JSON.stringify(record.config)===JSON.stringify(report.config)&&JSON.stringify(record.command||null)===JSON.stringify(report.perspective||null);
export function reportHandoff(g,origin,report){
 validateGuild(g);const otherPending=g.pending?.id||null;
 if(origin?.rehearsal||origin?.source==='rehearsal')return origin.kind==='guild-comparison'?{status:'rehearsal',title:'公会实装对照 · 未正式出征',text:'使用对照时的真实队伍资产与伙伴职责，本次未写入正式出征、结算或奖励。旧结果保持当时快照，重新运行才读取现状；正式出征仍按正常编号分配种子。',otherPending}:{status:'rehearsal',title:'试演战报 · 未正式出征',text:'没有支付培养草案、编入队伍或发放奖励；需要回营明确应用和正式出征。',otherPending};
 if(!origin?.source||origin.source==='experiment')return {status:'experiment',title:'实验战报 · 不发成长奖励',text:'这次试跑不写入公会履历。可以回到正式出征核对，以实际公会资产出发。',otherPending};
 if(origin.source==='record'){try{const p=bookProof(g,origin.route,origin.goal);if(p.id===origin.id&&origin.signature===JSON.stringify(p)&&matches(p,report))return {status:'recorded',title:'攻略首次达成 · '+GOALS.find(x=>x.id===origin.goal).name,text:'第'+p.id+'次方案按当前规则重演；首次指标保留，不发奖励、不修改攻略。',otherPending};}catch{}return {status:'stale',title:'攻略来源已变化',text:'请回营重新打开攻略记录；当前战报不能领取。',otherPending};}
 const record=g.history.find(r=>r.id===origin.id);
 if(['pending','history'].includes(origin.source)&&Number.isSafeInteger(origin.id)&&matches(record,report))return {status:'claimed',title:(origin.source==='history'?'历史重演 · ':'')+'第'+origin.id+'次正式远征 · 已领取',text:origin.source==='history'?'历史按当前规则重演，收益按原已领取记录显示，不再次发奖。':'下方是这次已经到账的收益，不是再次可领的奖励。',receipt:record,otherPending};
 if(origin.source==='pending'&&g.pending?.id===origin.id&&origin.signature===JSON.stringify(g.pending)&&matches(g.pending,report))return {status:'pending',title:'第'+origin.id+'次正式远征 · 待领取',text:'出征已记录，金币、经验与装备尚未入账。可先复盘，再领取归营。',receipt:pendingReward(g),otherPending:null};
 return {status:'stale',title:'这份战报无法对应当前结算',text:'公会或待结算远征已变化，不能从这份战报领取。请回营核对，原战报仍可阅读。',otherPending};
}
export function claimReport(g,origin,report){const state=reportHandoff(g,origin,report);if(state.status!=='pending')throw Error('这份战报没有匹配的待领取远征；请回营核对');return claim(g);}
