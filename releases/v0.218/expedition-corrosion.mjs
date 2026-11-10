// Original bounded damage over time, using existing magic resistance and effect expiry.
export const CORROSION={skill:'mireflask',name:'潮蚀',stat:'corrosion',value:6,duration:2};
export const corrosionOn=unit=>(unit.effects||[]).find(e=>e.skill===CORROSION.skill&&e.harmful);
export const corrosionTicks=unit=>unit.hp>0?(unit.effects||[]).filter(e=>e.stat===CORROSION.stat&&e.harmful&&e.active!==false&&e.value>0):[];
export const corrosionSource=e=>({effectId:e.id,source:e.source,name:e.name,component:e.component,stat:e.stat,value:e.value});
