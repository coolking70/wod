// Original encounter objective. No player-side timer, intervention or new expense.
export const HOLDOUT_RULE='提前清场，或撑过公开的完整回合数，至少一名正式队员仍存活，即可通过本房。回合结束才检查坚守；同一完整施放照常结算，最后一回合全员倒下仍失败。主动按计划撤退不算坚守完成。仍存活的敌人保留生命，不算击倒、不虚构伤害；仅按普通房间与通关规则领奖，不另发坚守奖励。生命、法力、道具和物资按原规则跨房延续。全部计时、遭遇及数值是项目原创。';
export function validateHoldoutRoom(room,waves){
 if(!Object.hasOwn(room,'holdout'))return;
 const h=room.holdout;if(!h||Array.isArray(h)||Object.keys(h).length!==1||!Object.hasOwn(h,'rounds')||!Number.isSafeInteger(h.rounds)||h.rounds<1||h.rounds>12||waves.length!==1||room.surrender)throw Error('坚守目标须为单波房间的1–12个完整回合，不能与投降目标混用');
}
export function holdoutOutcome(room,completedRounds,party,enemies,won){
 if(!room.holdout)return null;
 const remaining=enemies.filter(u=>u.hp>0).map(u=>({id:u.id,name:u.name,hp:u.hp,mp:u.mp}));
 return {targetRounds:room.holdout.rounds,completedRounds,mode:won?(remaining.length?'held':'cleared'):'failed',remaining,alive:party.filter(u=>u.hp>0).length,rule:HOLDOUT_RULE};
}
const row=(skill,target='front',mode='repeat')=>({skill,target,mode});
const foe=(id,name,pos,hp,skill,level=7)=>({id,name,pos,gear:'field',mark:'守',attrs:{str:14,con:13,int:15,dex:14,cha:10,agi:12,per:12,wil:13},hp,maxHp:hp,mp:70,maxMp:70,skills:{[skill]:level},prep:[],main:[row(skill,skill==='shot'?'rear':'front')],healing:{enabled:false},defenses:{melee:'natural',ranged:'natural',magic:'natural'}});
export const HOLDOUT_ROOMS=[
 {id:'holdout-quay',name:'01 · 等潮旧栈桥',holdout:{rounds:3},note:'撑过第3完整回合即可随潮撤离，也可提前清场。前排守军牵制，弩手攻击后排；鼓令可增加前排行动。清源、保护、削弱和救护争用原行动。',enemies:[{...foe('hqg','系缆守军','front',180,'strike'),skills:{strike:7,guard:5},prep:[row('guard','self')]},foe('hqa','栈桥追弩手','rear',140,'shot'),{...foe('hqd','催潮鼓手','center',100,'strike',5),skills:{strike:5,rhythm:6},prep:[row('rhythm','front')]}]},
 {id:'holdout-causeway',name:'02 · 退潮引航道',holdout:{rounds:4},note:'生命与物资继承；撑过第4完整回合或提前清场即可回岸。前排拦路卫配合后排法术和弩火，不能只看近战防御。存活敌人不会被算作已击倒。',enemies:[foe('hcg','引航道拦路卫','front',210,'strike',8),foe('hcm','回潮术士','center',150,'spark',8),foe('hca','离岸弩手','rear',130,'shot',8)]}
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const count=(n,max=24)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const validPlan=h=>h&&typeof h==='object'&&!Array.isArray(h)&&count(h.rounds,12)&&h.rounds>0;
const validProgress=d=>d&&count(d.targetRounds,12)&&d.targetRounds>0&&count(d.completedRounds)&&count(d.alive,6);
const validResult=h=>h&&typeof h==='object'&&!Array.isArray(h)&&['held','cleared','failed'].includes(h.mode)&&validProgress(h)&&Array.isArray(h.remaining)&&h.remaining.length<=40&&h.remaining.every(u=>u&&typeof u.id==='string'&&u.id.length<=100&&typeof u.name==='string'&&u.name.length<=100&&Number.isSafeInteger(u.hp)&&u.hp>0&&Number.isSafeInteger(u.mp)&&u.mp>=0)&&new Set(h.remaining.map(u=>u.id)).size===h.remaining.length&&(h.mode!=='cleared'||h.remaining.length===0)&&(h.mode!=='held'||h.completedRounds>=h.targetRounds&&h.alive>0&&h.remaining.length>0);
const unverified='<strong class="holdout-unverified">坚守记录未核实</strong><p>记录字段不完整或无效，无法据此确认进度或通过；原始战报保持，可导出核对。</p>';
export function holdoutPreparationView(rooms){const rows=rooms.filter(r=>r.holdout);return rows.length?`<section class="holdout-preparation"><h3>公开坚守条件 · 可提前清场</h3>${rows.map(r=>validPlan(r.holdout)?`<p>${esc(r.name)}：${esc(r.holdout.rounds)}个完整回合；至少一名正式队员生还。</p>`:unverified).join('')}<small>${HOLDOUT_RULE}</small></section>`:'';}
export function holdoutFrame(report,eventId){
 const end=report.events.findIndex(e=>e.id===eventId);if(end<0)return null;const now=report.events[end];let plan=null,progress=null,result=null,invalid=false,seen=false;
 for(let i=0;i<=end;i++){
  const e=report.events[i];if(e.roomIndex!==now.roomIndex)continue;
  if(e.type==='room'&&e.detail?.holdoutPlan!==undefined){seen=true;plan=e.detail.holdoutPlan;if(!validPlan(plan))invalid=true;}
  if(e.type==='holdout-progress'){seen=true;progress=e.detail;if(!validProgress(progress)||!validPlan(plan)||progress.targetRounds!==plan.rounds)invalid=true;}
  if(['victory','defeat'].includes(e.type)&&e.detail?.holdout!==undefined){seen=true;result=e.detail.holdout;if(!validResult(result)||!validPlan(plan)||result.targetRounds!==plan.rounds||(e.type==='victory')===(result?.mode==='failed'))invalid=true;}
 }
 if(!seen)return null;if(invalid||!validPlan(plan))return {unverified:true};
 return {targetRounds:plan.rounds,completedRounds:progress?.completedRounds||0,result,rule:HOLDOUT_RULE};
}
export function holdoutSnapshotView(report,eventId){const h=holdoutFrame(report,eventId);if(!h)return '';if(h.unverified)return unverified;return `<strong>坚守撤离 · 完整回合 ${esc(h.completedRounds)}/${esc(h.targetRounds)}</strong><p>${h.result?(h.result.mode==='held'?'撤离条件已达成；'+h.result.remaining.length+'名敌人仍存活，未计击倒':h.result.mode==='cleared'?'已清场；按本房条件通过':'本次坚守止步'):'也可提前清场；进度只含已结束的回合，不预测后续结果。'}</p>`;}
export function holdoutEvidenceView(e){const d=e?.detail,h=d?.holdout;if(!h&&e?.type!=='holdout-progress')return '';if(h?(!validResult(h)||!['victory','defeat'].includes(e.type)||(e.type==='victory')===(h.mode==='failed')):!validProgress(d))return `<section class="holdout-proof">${unverified}</section>`;return `<section class="holdout-proof"><h3>${h?(h.mode==='held'?'完成坚守，随潮撤离':h.mode==='cleared'?'清场通过':'坚守止步'):'完整回合已结束'}</h3><p>已完成 ${esc(h?.completedRounds??d.completedRounds)} / ${esc(h?.targetRounds??d.targetRounds)} 回合。${h?'仍存活敌人：'+(h.remaining.map(u=>esc(u.name)+' HP'+esc(u.hp)+' / MP'+esc(u.mp)).join('、')||'无'):''}</p><small>${HOLDOUT_RULE}</small></section>`;}
