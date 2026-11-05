import {FOUNDRY_ROOMS} from './expedition-foundry.mjs';
export const FOUNDRY_OBJECTIVES={
 blueprints:{name:'封存图纸',desc:'通关铸库、六人生还，四场累计不超过18回合，并留下至少3符纸与3箭矢。',gold:20,gear:'kilngauge'},
 home:{name:'整队归航',desc:'通关铸库、六人生还，正式队员剩余总生命至少为总生命上限的90%。',gold:20,gear:'bellowscoat'}
};
export function validateFoundryState(state){
 if(state===undefined)return;
 if(!state||typeof state!=='object'||Array.isArray(state)||!Array.isArray(state.claimed)||new Set(state.claimed).size!==state.claimed.length||state.claimed.some(id=>!Object.hasOwn(FOUNDRY_OBJECTIVES,id)))throw Error('铸库委托存档无效');
}
export function foundryAssessment(report){
 if(report.config.expedition!=='foundry')return null;
 const members=report.party.filter(u=>!u.owner&&report.config.heroes.some(h=>h.id===u.id)),alive=members.filter(u=>u.hp>0).length,six=members.length===6&&alive===6,hp=members.reduce((n,u)=>n+u.hp,0),maxHp=members.reduce((n,u)=>n+u.maxHp,0),rounds=report.rooms.reduce((n,r)=>n+r.rounds,0);
 const cleared=report.rooms.filter(r=>r.won).length,won=report.won&&report.rooms.length===FOUNDRY_ROOMS.length&&cleared===FOUNDRY_ROOMS.length;
 const metrics={won,cleared,alive,hp,maxHp,hpPercent:maxHp>0?Math.floor(hp*100/maxHp):0,rounds,rune:report.supplies.rune,arrow:report.supplies.arrow};
 return {metrics,goals:{blueprints:won&&six&&rounds<=18&&metrics.rune>=3&&metrics.arrow>=3,home:won&&six&&maxHp>0&&hp*10>=maxHp*9}};
}
export function foundryReward(report,g){
 const check=foundryAssessment(report);if(!check)return null;validateFoundryState(g.foundry);
 const claimed=g.foundry?.claimed||[],earned=Object.keys(FOUNDRY_OBJECTIVES).filter(id=>check.goals[id]&&!claimed.includes(id));
 return {...check,earned,gold:earned.reduce((n,id)=>n+FOUNDRY_OBJECTIVES[id].gold,0),loot:earned.map(id=>FOUNDRY_OBJECTIVES[id].gear)};
}
