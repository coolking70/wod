export const REGENERATION_STAT='regeneration';
export function regenerationTicks(unit){
 if(unit.hp<=0)return [];
 return (unit.effects||[]).filter(e=>e.stat===REGENERATION_STAT&&e.active!==false&&e.value>0);
}
