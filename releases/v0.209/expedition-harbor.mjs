import {HARBOR_RESERVE,harborReserveFloor} from './expedition-harbor-reserve.mjs';
import {gearSupports} from './expedition-equipment.mjs';
export const HARBOR_PASS={adaptive:'按状态择路',upper:'优先高架栈桥',lower:'优先潮汐暗渠'};
export const HARBOR_TASK={adaptive:'按补给处理',seal:'尝试解读封印',salvage:'打捞药箱',conserve:'保存物资'};
export const HARBOR_DIFFICULTY={normal:'普通航路',storm:'风暴委托'};
export const harborDifficulty=c=>c.harbor?.difficulty||'normal';
export const harborPlan=()=>({pass:'adaptive',task:'adaptive'});
export function validHarborPlan(p){return !!p&&Object.keys(p).every(k=>['pass','task','difficulty','reserve'].includes(k))&&(!Object.hasOwn(p,'difficulty')||Object.hasOwn(HARBOR_DIFFICULTY,p.difficulty))&&(!Object.hasOwn(p,'reserve')||Object.hasOwn(HARBOR_RESERVE,p.reserve))&&Object.hasOwn(HARBOR_PASS,p.pass)&&Object.hasOwn(HARBOR_TASK,p.task);}
const row=(skill,target='front')=>({skill,target,mode:'repeat'});
function enemy(id,name,pos,skill,hp,level=7){return {id,name,pos,side:'enemy',role:'港口守望者',mark:skill==='shot'?'弩':skill==='wave'?'潮':'卫',gear:'field',attrs:{str:12,con:12,int:14,dex:14,cha:8,agi:10,per:12,wil:12},skills:{[skill]:level},hp,maxHp:hp,mp:70,maxMp:70,defenses:{melee:'natural',ranged:'natural',magic:'resist'},defenseFocus:'resist',prep:[],main:[row(skill,skill==='shot'?'rear':skill==='wave'?'center':'front')],healing:{enabled:false},effects:[]};}
const room=(id,node,name,note,enemies)=>({id,node,name,note,enemies});
export const HARBOR_NODES={
 gate:room('harbor_gate','gate','01 · 盐风关卡','前排锚卫掩护后排弩手；先保留药草，下一处通路依据战后状态选择。',[enemy('hg1','锈锚卫','front','strike',180),enemy('hg2','巡港弩手','rear','shot',110)]),
 upper:room('harbor_pass','upper','02 · 高架栈桥','两翼弩手狙击后排；远程抗性与分区保护有用。同位置群攻无法一次覆盖两翼。',[enemy('hu1','链桥卫','front','strike',160),enemy('hu2','左塔弩手','left','shot',100,9),enemy('hu3','右塔弩手','right','shot',100,9)]),
 lower:room('harbor_pass','lower','02 · 潮汐暗渠','潮咒压制中央；法术抗性、分散站位与抵抗可减少承伤。',[{...enemy('hl1','潮渠壳卫','front','strike',170),resistances:{ranged:35}},enemy('hl2','潮渠祭司','rear','wave',140,9)]),
 seal:room('harbor_cache','seal','03 · 潮锁机房','进入机房先尝试解封，再迎战守卫。成功解读会削弱末场灯塔核心；失败消耗照付。',[enemy('hs1','机房卫','front','strike',180),enemy('hs2','锁印者','rear','spark',130,8)]),
 salvage:room('harbor_cache','salvage','03 · 漂流药仓','打捞带回4份药草，但会惊动额外弩手。药箱不会恢复生命或复活队员。',[enemy('hc1','沉仓卫','front','strike',170),enemy('hc2','药仓伏弩','rear','shot',100,8),enemy('hc3','惊动的巡弩','left','shot',90,8)]),
 bypass:room('harbor_cache','bypass','03 · 外港巡道','绕过机房与药仓，不支付物资，也不获取封印优势。',[enemy('hb1','巡道卫','front','strike',180),enemy('hb2','巡道弩手','rear','shot',110,8)]),
 beacon:room('harbor_beacon','beacon','04 · 无光灯塔','灯塔核心压制中央，后排药灯守护者持续救护。封印成功则核心法术等级降低3级。',[{...enemy('hf1','无光核心','front','wave',330,10),resistances:{magic:35}}, {...enemy('hf2','药灯守护者','rear','spark',150,7),skills:{spark:7,heal:8},healing:{enabled:true,threshold:.8,target:'all',priority:'lowest'}}])
};
export const HARBOR_ROOMS=[HARBOR_NODES.gate,{...HARBOR_NODES.upper,name:'02 · 栈桥 / 暗渠（分支槽）',note:'高架栈桥：双翼弩手；潮汐暗渠：中央法术。实际路线按预设与首战后的状态选择，详见下方分支计划。'},{...HARBOR_NODES.bypass,name:'03 · 机房 / 药仓 / 巡道（分支槽）',note:'封印、打捞或绕行，按事先设定自动处理。此处敌人为保守巡道基线，各分支敌情见计划。'},HARBOR_NODES.beacon];
export const HARBOR_EDGES={gate:['upper','lower'],upper:['seal','salvage','bypass'],lower:['seal','salvage','bypass'],seal:['beacon'],salvage:['beacon'],bypass:['beacon'],beacon:[]};

// Independent templates: previews and simulation read the same authored enemies.
export function harborNodes(c){
 const nodes=structuredClone(HARBOR_NODES);if(harborDifficulty(c)!=='storm')return nodes;
 for(const r of Object.values(nodes)){
  r.name+=' · 风暴';
  for(const u of r.enemies){u.hp=u.maxHp=Math.round(u.hp*1.45);u.mp=u.maxMp=100;for(const k of Object.keys(u.skills))u.skills[k]+=3;}
 }
 const medic=(id,pos='rear')=>({...enemy(id,'风暴药灯师',pos,'spark',190,9),skills:{spark:9,heal:12},resistances:{magic:65},healing:{enabled:true,threshold:.8,target:'all',priority:'lowest'}});
 nodes.gate.enemies.push(medic('hg3'));
 nodes.gate.note='风暴：后排药灯师法术抗性65%，持续治疗前排。射手可按治疗者职责集火；全队只打前排会延长战斗。';
 nodes.upper.enemies[0].skills.ward=9;nodes.upper.enemies[0].prep=[row('ward','rear')];
 nodes.upper.enemies.push(medic('hu4'));
 nodes.upper.note='风暴：两翼弩手保持交叉射击，后排药灯师由屏障掩护。远程抗性和后排保护有用；优先切断治疗。';
 nodes.lower.enemies.push({...enemy('hl3','潮渠唤灵者','center','spark',190,9),skills:{spark:9,sentinel:9},prep:[{skill:'sentinel',target:'front',mode:'once'}],resistances:{ranged:60}});
 nodes.lower.note='风暴：中央唤灵者远程抗性60%，召唤守卫；后排祭司群攻中央。法师处理中央支援，分散阵位降低群攻覆盖。';
 nodes.seal.enemies.push(medic('hs3'));
 nodes.seal.note+=' 风暴：新增抗法药灯师，解封不会消除本场敌人。';
 nodes.bypass.enemies.push(medic('hb3'));
 nodes.bypass.note+=' 风暴：巡道也有药灯师，绕行不是无战斗捷径。';
 nodes.salvage.enemies[2].skills.shot+=2;nodes.salvage.note+=' 风暴：额外巡弩强化，补给收益需付出承伤代价。';
 nodes.beacon.enemies[1].resistances={magic:65};
 nodes.beacon.enemies.push({...enemy('hf3','灯塔唤灵者','center','spark',220,10),skills:{spark:10,sentinel:10},prep:[{skill:'sentinel',target:'front',mode:'once'}],resistances:{ranged:60}});
 nodes.beacon.note='风暴：核心法术13级压制中央，后排抗法药师、中央抗远程唤灵者协作。封印成功使核心13→10；输出分工与低消耗备用指令都重要。';
 return nodes;
}
export function harborRooms(c){const n=harborNodes(c);return [n.gate,{...n.upper,name:'02 · 栈桥 / 暗渠（分支槽）',note:'分支基线显示栈桥；暗渠及完整敌情见事件策略。 '+n.upper.note},{...n.bypass,name:'03 · 机房 / 药仓 / 巡道（分支槽）',note:'分支基线显示巡道；机房、药仓敌情见事件策略。 '+n.bypass.note},n.beacon];}

export function resolveHarborStep(index,c,party,supplies,readMean,resistance,rng,flags={}){
 const live=party.filter(u=>u.hp>0),before=structuredClone(supplies),delta={herb:0,rune:0,arrow:0};let node=['gate','upper','bypass','beacon'][index],reason='',actor=null,check=null,sealed=!!flags.sealed;
 const hp=live.reduce((n,u)=>n+u.hp,0),maxHp=party.reduce((n,u)=>n+u.maxHp,0),protectedCount=live.filter(u=>resistance(u,'magic')>=15).length;
 if(index===1){const policy=c.harbor.pass;node=policy==='adaptive'?(hp/maxHp<.65||supplies.herb<4?'upper':protectedCount>=3?'lower':'upper'):policy;reason=policy==='adaptive'?`当前生命 ${hp}/${maxHp}；药草 ${supplies.herb}；法术抗性≥15%的存活队员 ${protectedCount} 人。生命不足65%或药草少于4份走栈桥，否则至少3名抗性达标者走暗渠，其余走栈桥。`:`按战前固定偏好选择${HARBOR_PASS[policy]}，不因战后状态改选。`;}
 if(index===2){let task=c.harbor.task;if(task==='adaptive')task=supplies.herb<6?'salvage':'seal';
  if(task==='salvage'){node='salvage';delta.herb=4;reason='打捞药箱获得4药草，惊动额外巡弩；不直接恢复生命。';}
  else if(task==='seal'){
   const candidates=live.filter(u=>gearSupports(u.gear,'focus')).flatMap(u=>['ward','spark'].filter(s=>u.skills[s]!==undefined).map(skill=>({id:u.id,skill,mean:readMean(u,skill)}))).sort((a,b)=>b.mean-a.mean);const best=candidates[0];
   if(!best||supplies.rune<2){node='bypass';reason=!best?'没有存活且携法器的解读者，自动绕行，不扣费。':'符纸不足2份，自动绕行，不扣费。';}
   else{node='seal';actor=best.id;delta.rune=-2;const factors=[rng(),rng()],rolled=Math.floor(best.mean*(.5+(factors[0]+factors[1])/2));sealed=rolled>=65;check={...best,factors,rolled,threshold:65,success:sealed};reason=`支付2符纸，${best.skill==='ward'?'屏障学识':'微光辨印'}检定 ${rolled} / 65：${sealed?'解封成功，末场核心法术等级-3':'解封失败，末场核心保持原强度'}。`;}
  }else{node='bypass';reason='按战前策略保存物资，不尝试解封或打捞。';}
 }
 const nodes=harborNodes(c),selected=nodes[node],coreLevel=nodes.beacon.enemies[0].skills.wave;if(index===3&&sealed){selected.enemies[0].skills.wave-=3;selected.note+=` 已兑现解封优势：法术等级${coreLevel}→${coreLevel-3}。`;}
 const after=Object.fromEntries(Object.entries(before).map(([k,v])=>[k,v+(delta[k]||0)]));
 return {room:selected,flags:{sealed},delta,decision:[1,2,3].includes(index)?{node,reserveReleased:index===2&&harborReserveFloor(c,1)>0,difficulty:harborDifficulty(c),policy:index===1?c.harbor.pass:index===2?c.harbor.task:'consequence',reason:index===3?(sealed?`前次封印解读成功，核心法术等级${coreLevel}→${coreLevel-3}。`:`没有成功解封记录，核心法术等级仍为${coreLevel}。`):reason,actor,check,sealed,suppliesBefore:before,suppliesAfter:after,observed:{hp,maxHp,alive:live.length,protectedCount},image:index>=2&&node!=='salvage'?'harbor-seal-v41.png':'saltwind-harbor-v41.png'}:null};
}
