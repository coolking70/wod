import {clone,HEROES,row} from './expedition-data.mjs';
export const HARBOR_TACTICS={roles:{name:'职责分工',desc:'保留当前站位；射手优先治疗者；潮术师和学者优先唤灵者，保留低消耗后备。'},spread:{name:'分工与分散',desc:'在职责分工基础上，学者到右翼、药师到左翼；屏障保护后排，启蒙覆盖右翼。降低中央群攻覆盖，但辅助覆盖也随之改变。'}};
export function applyHarborTactics(input,kind){
 if(input.expedition!=='harbor'||!Object.hasOwn(HARBOR_TACTICS,kind))throw Error('港口战术方案无效');
 const c=clone(input);
 for(const h of c.heroes){const role=HEROES.find(x=>x.id===h.id).classId;
  for(const id of ['harbor_gate','harbor_pass','harbor_cache','harbor_beacon']){
   const p=h.overrides[id]??={};
   if(role==='ranger')p.main=[row('pierce','healer'),row('shot','healer'),row('shot','rear')];
   if(role==='tidecaller')p.main=[row('spark','summoner'),row('wave','front'),row('spark','front')];
   if(role==='scholar')p.main=[row('spark','summoner'),row('spark','front')];
   if(kind==='spread'){
    if(role==='scholar'){p.pos='right';p.prep=[row('ward','rear')];}
    if(role==='herbalist')p.pos='left';
    if(role==='bard')p.prep=[row('insight','right','once'),row('mastery','rear')];
   }
  }
 }
 return c;
}
