import {equipmentTotals,replaceEquipment} from './expedition-equipment.mjs';
import {GEAR,ATTR,SKILLS,DEFENSES} from './expedition-data.mjs';
export const ROUTE_REWARDS={
 manashield:{bonus:60,xp:25,firstGold:40,firstXp:10,pool:[]},
 parleyquay:{bonus:60,xp:25,firstGold:40,firstXp:10,pool:[]},
 markedhunt:{bonus:60,xp:25,firstGold:40,firstXp:10,pool:[]},
 sporegrove:{bonus:60,xp:25,firstGold:40,firstXp:10,pool:[]},
 pressurevault:{bonus:50,xp:20,firstGold:30,firstXp:10,pool:[]},
 evacuation:{bonus:60,xp:25,firstGold:40,firstXp:10,pool:[]},
 lockworks:{bonus:50,xp:20,firstGold:50,firstXp:20,pool:[]},
 turncourt:{bonus:45,xp:20,firstGold:40,firstXp:15,pool:[]},
 beaconbridge:{bonus:60,xp:25,firstGold:60,firstXp:25,pool:['bridgehorn','bridgecoat','bridgebadge']},
 trapworks:{bonus:50,xp:20,firstGold:50,firstXp:20,pool:[]},
 ossuary:{bonus:45,xp:20,firstGold:40,firstXp:15,pool:[]},
 breakwater:{bonus:60,xp:25,firstGold:50,firstXp:20,pool:[]},
 counterpoint:{bonus:35,xp:15,firstGold:35,firstXp:15,pool:[]},
 confluence:{bonus:60,xp:25,firstGold:55,firstXp:20,pool:['triagepin']},
 clocktower:{bonus:70,xp:25,firstGold:55,firstXp:20,pool:['clockpin']},
 greenhouse:{bonus:75,xp:30,firstGold:55,firstXp:20,pool:['filterveil']},
 scriptorium:{bonus:65,xp:25,firstGold:55,firstXp:20,pool:['counterlens']},
 palisade:{bonus:55,xp:20,firstGold:55,firstXp:20,pool:['watchmantle']},
 inquest:{bonus:50,xp:20,firstGold:50,firstXp:20,pool:['calmribbon']},
 shoals:{bonus:55,xp:20,firstGold:55,firstXp:20,pool:['saltcloak','echocharm']},
 theater:{bonus:45,xp:20,firstGold:45,firstXp:15,pool:['votivelute','echocharm']},
 courier:{bonus:75,xp:25,firstGold:65,firstXp:25,pool:['postbell']},
 foundrywatch:{bonus:80,xp:30,firstGold:70,firstXp:30,pool:['watchseal']},
 foundry:{bonus:70,xp:25,firstGold:70,firstXp:25,pool:['bellowscoat','kilngauge']},
 harbor:{bonus:85,xp:30,firstGold:80,firstXp:30,pool:["beaconrod","quaycoat","tidecompass"]},
 seasoned:{bonus:65,xp:25,firstGold:65,firstXp:25,pool:["tidebow","saltcloak","remedybag"]},
 veteran:{bonus:90,xp:40,firstGold:90,firstXp:40,pool:["reliquaryshield","bellfocus","votivelute"]},
 tutorial:{bonus:20,xp:0,firstGold:0,firstXp:0,pool:[]},
 classic:{bonus:30,xp:5,firstGold:30,firstXp:10,pool:['reliquaryshield','tidebow']},
 archive:{bonus:40,xp:10,firstGold:40,firstXp:15,pool:['bellfocus','saltcloak']},
 hospice:{bonus:40,xp:10,firstGold:40,firstXp:15,pool:['remedybag','votivelute']},
 survival:{bonus:50,xp:15,firstGold:50,firstXp:20,pool:['saltcloak','reliquaryshield']},
 vigil:{bonus:50,xp:15,firstGold:50,firstXp:20,pool:['votivelute','bellfocus']},
 scarcity:{bonus:60,xp:20,firstGold:60,firstXp:25,pool:['tidebow','remedybag']},
 chapter:{bonus:80,xp:30,firstGold:80,firstXp:30,pool:['bellfocus','remedybag','reliquaryshield','tidebow','saltcloak','votivelute']}
};
for(const [route,id] of Object.entries({classic:'anchorseal',survival:'anchorseal',archive:'echocharm',vigil:'echocharm',hospice:'wardpendant',scarcity:'wardpendant'}))ROUTE_REWARDS[route].pool.push(id);
ROUTE_REWARDS.chapter.pool.push('anchorseal','echocharm','wardpendant');
export const isRelic=id=>!!GEAR[id]?.dungeonOnly;
export function rewardPreview(route){const r=ROUTE_REWARDS[route];return `${route==='foundry'?'以下为基础奖励；铸库两项一次性委托另有20金币与指定遗物，见远征委托。':''}${route==='harbor'?'普通与风暴共用路线首通记录；风暴另有一次性委托（见港口委托）。每次通关另得1张海图；首次六人归航再得1张，2张可兑换指定装备。':''}每场20金币/每位出战者10经验；通关另加${r.bonus}金币/每位出战者${r.xp}经验。${r.pool.length?`通关必得1件：${r.pool.map(k=>GEAR[k].name).join('、')}；首次通关固定获得${GEAR[r.pool[0]].name}，额外${r.firstGold}金币/每位出战者${r.firstXp}经验。`:r.firstGold||r.firstXp?`本路线无装备掉落；首次通关额外${r.firstGold}金币/每位出战者${r.firstXp}经验。`:'引导路线无装备掉落和首次通关加成。'}`;}
export function expeditionReward(report,{version=2,first=false,id=1}={}){const cleared=report.rooms.filter(r=>r.won).length;
 if(version===1)return {cleared,gold:cleared*20+(report.won?20:0),xp:cleared*10};
 const r=ROUTE_REWARDS[report.config.expedition],won=report.won,firstClear=won&&first;
 // Loot uses its own deterministic stream; it never consumes combat randomness.
 let x=(report.config.seed^Math.imul(id,0x45d9f3b))>>>0;for(const ch of report.config.expedition)x=Math.imul(x^ch.charCodeAt(0),16777619)>>>0;
 // Avalanche high bits into low bits: normal departure id and seed coincide,
 // so using the old low bit alone pinned every two-item pool to one item.
 x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);x=(x^(x>>>16))>>>0;
 const gear=won&&r.pool.length?r.pool[firstClear?0:x%r.pool.length]:null;
 return {cleared,gold:cleared*20+(won?r.bonus:0)+(firstClear?r.firstGold:0),xp:cleared*10+(won?r.xp:0)+(firstClear?r.firstXp:0),firstClear,loot:gear?[gear]:[]};
}
export function gearDifference(current,next){const a=equipmentTotals(current),b=equipmentTotals(typeof current==='string'?next:replaceEquipment(current,next));return [['护甲',b.armor-a.armor],['生命上限',4*((b.bonus.con||0)-(a.bonus.con||0))],['法力上限',2*((b.bonus.int||0)-(a.bonus.int||0))+(b.bonus.wil||0)-(a.bonus.wil||0)],...Object.entries(ATTR).map(([k,name])=>[name,(b.bonus[k]||0)-(a.bonus[k]||0)]),...Object.entries({melee:'近战抗性(百分点)',ranged:'远程抗性(百分点)',magic:'法术抗性(百分点)',mental:'心理抗性(百分点)'}).map(([k,name])=>[name,(b.resistances[k]||0)-(a.resistances[k]||0)]),...[...new Set([...Object.keys(a.ranks||{}),...Object.keys(b.ranks||{})])].map(k=>[(k.startsWith('skill:')?SKILLS[k.slice(6)]:DEFENSES[k.slice(8)]).name+'等级',(b.ranks?.[k]||0)-(a.ranks?.[k]||0)])].filter(([,v])=>v!==0).map(([name,v])=>`${name} ${v>0?'+':''}${v}`).join(' / ')||'数值相同';}
