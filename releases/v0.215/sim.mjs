import {VERSION,POS,TYPES,ATTRS,TRAIN,GEAR,SUPPLIES,SKILLS,HEROES,ROOMS,copy} from './content.mjs';
export const ROUTES={front:['front','center','back','left','right'],left:['right','front','center','back','left'],right:['left','front','center','back','right'],center:['front','center','back','right','left'],back:['front','center','right','left','back']};
const alive=us=>us.filter(u=>u.hp>0);
export function validate(c){
 if(!c||c.version!==VERSION||!Array.isArray(c.heroes)||c.heroes.length!==HEROES.length)throw Error('配置版本或队员数量不匹配');
 if(!Number.isInteger(c.seed)||c.seed<1||c.seed>999999)throw Error('种子须为 1–999999 的整数');
 if(!c.supplies||Object.keys(c.supplies).some(k=>!Object.hasOwn(SUPPLIES,k)))throw Error('未知补给字段');
 let supply=0;for(const k of Object.keys(SUPPLIES)){const n=c.supplies?.[k];if(!Number.isInteger(n)||n<0||n>24)throw Error('补给数量无效');supply+=n;}if(supply>24)throw Error('补给预算超过 24');
 for(const h of HEROES){const matches=c.heroes.filter(b=>b.id===h.id);if(matches.length!==1)throw Error('队员 ID 重复或缺失');const b=matches[0];if(!Object.hasOwn(GEAR,b.gear)||!Object.hasOwn(POS,b.pos))throw Error('装备或站位无效');
  for(const [field,keys,max] of [['attrs',ATTRS,6],['training',TRAIN,12]]){if(!b[field]||Object.keys(b[field]).some(k=>!Object.hasOwn(keys,k)))throw Error('未知培养字段');let total=0;for(const k of Object.keys(keys)){const n=b[field]?.[k];if(!Number.isInteger(n)||n<0||n>max)throw Error('培养点数无效');total+=n;}if(total>max)throw Error(h.name+' 的培养预算超限');}
  if(!b.overrides||typeof b.overrides!=='object'||Array.isArray(b.overrides))throw Error('楼层配置无效');
  for(const key of Object.keys(b.overrides))if(!['0','1','2','3'].includes(key))throw Error('未知楼层');
  for(const cfg of [b,...Object.values(b.overrides)]){if(cfg.pos!==undefined&&!Object.hasOwn(POS,cfg.pos))throw Error('楼层站位无效');for(const phase of ['prep','main']){if(cfg[phase]===undefined){if(cfg===b)throw Error('缺少默认行动列表');continue;}if(!Array.isArray(cfg[phase])||cfg[phase].length>4)throw Error('每阶段最多四条指令');for(const r of cfg[phase]){const s=SKILLS[r.skill];if(!Object.hasOwn(SKILLS,r.skill)||s.phase!==phase||(r.skill!=='basic'&&!h.skills.includes(r.skill)))throw Error('不合法的职业技能');if(![...Object.keys(POS),'self','all'].includes(r.target)||!['standard','repeat','once'].includes(r.mode))throw Error('不合法的战术参数');}}}
 }
 return true;
}
export function buildHero(h,b){const gear=GEAR[b.gear],a=Object.fromEntries(Object.keys(ATTRS).map(k=>[k,h.attrs[k]+b.attrs[k]]));const tr=b.training;return {...h,pos:b.pos,attrs:a,training:copy(tr),hp:h.hp+(gear.hp||0)+tr.defense*3,maxHp:h.hp+(gear.hp||0)+tr.defense*3,mp:h.mp+(gear.mp||0),maxMp:h.mp+(gear.mp||0),hit:2*(h.type==='melee'?a.dex:h.type==='ranged'?a.per:a.int)+a.per+tr.attack*2+(gear.hit||0),damage:14+tr.attack*1.7+(gear.damage||0),def:{melee:a.dex+a.per/2+tr.defense*2+(gear.def?.melee||0),ranged:a.per+a.dex/2+tr.defense*2+(gear.def?.ranged||0),magic:a.will+a.int/2+tr.defense*2+(gear.def?.magic||0)},support:a.int/2+tr.support*1.5+(gear.support||0),speed:a.per+a.dex/2+(gear.speed||0),buffs:[],enemy:false};}
function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function effective(u,key){let base=key.endsWith('Def')?u.def[key.slice(0,-3)]:u[key]||0;return base+u.buffs.reduce((n,b)=>n+(b.stat===key||key.endsWith('Def')&&b.stat==='allDef'?b.value:0),0);}
export function targetGroup(list,pos,type,requested){let living=alive(list);if(type==='melee'){for(const p of ROUTES[pos]){const group=living.filter(u=>u.pos===p);if(group.length)return group;}}if(requested==='all')return living;return living.filter(u=>u.pos===requested).length?living.filter(u=>u.pos===requested):living;}
export function simulate(config,{capture=true}={}){
 validate(config);const c=copy(config),roll=random(c.seed);let party=HEROES.map(h=>buildHero(h,c.heroes.find(b=>b.id===h.id))),supplies=copy(c.supplies),rooms=[],events=[],round=0,roomIndex=0,stage='';let foes=[],seal=0,force=0;
 const stats=Object.fromEntries(HEROES.map(h=>[h.id,{name:h.name,damage:0,healing:0,mana:0,buffs:0,assists:0,miss:0,hits:0,taken:0,solved:0,skipped:0}]));
 function emit(kind,text,detail={},actor=null,targets=[]){if(!capture)return;events.push({roomIndex,round,stage,kind,text,detail,actor,targets,seal,supplies:copy(supplies),units:copy([...party,...foes])});}
 function aidTargets(a,target){let us=alive(party).filter(t=>target==='all'||target==='self'?target==='all'||t.id===a.id:t.pos===target);return us;}
 function swing(a,t,type,power=1,debuff=false){const contributors=[...a.buffs.filter(b=>b.stat==='hit'),...t.buffs.filter(b=>b.stat===type+'Def'||b.stat==='allDef')];let av=effective(a,'hit'),dv=effective(t,type+'Def');if(type==='melee'&&['left','right'].includes(a.pos)&&t.pos==='front')av*=1.15;const attack=Math.round(av*(.65+roll()*.7)),defense=Math.round(dv*(.65+roll()*.7)),hit=attack>defense;let n=0;
  if(hit){n=Math.round(a.damage*power*(attack>defense*1.5?1.3:1));n=Math.min(t.hp,n);t.hp-=n;if(debuff)t.buffs=[...t.buffs.filter(b=>b.skill!=='armor-break'),{skill:'armor-break',stat:'allDef',value:-6,until:99,source:a.id}];}
  if(stats[a.id]){stats[a.id][hit?'hits':'miss']++;stats[a.id].damage+=n;}if(stats[t.id])stats[t.id].taken+=n;
  for(const b of contributors)if(stats[b.source]&&b.source!==a.id&&b.source!==t.id)stats[b.source].assists++;
  emit(hit?'hit':'miss',a.name+' → '+t.name+'：'+(hit?n+' 伤害':'未命中'),{type:TYPES[type],attack,defense,baseAttack:Math.round(a.hit),baseDefense:Math.round(t.def[type]),buffs:contributors.map(b=>(party.find(p=>p.id===b.source)?.name||b.source)+'·'+(SKILLS[b.skill]?.name||b.skill)),rule:attack>defense*1.5?'超过防御 1.5 倍，效果 ×1.3':'攻击检定须大于对应防御检定'},a.id,[t.id]);return hit;
 }
 for(roomIndex=0;roomIndex<ROOMS.length;roomIndex++){
  const room=ROOMS[roomIndex];seal=0;force=0;round=0;stage='进场';
  const configs=Object.fromEntries(c.heroes.map(b=>[b.id,{...b,...b.overrides[roomIndex]}]));
  party.forEach(h=>{h.pos=configs[h.id].pos;h.buffs=[];});
  foes=room.enemies.map((e,i)=>({id:'e'+i,name:e[0],pos:e[1],type:e[2],hp:e[3],maxHp:e[3],mp:0,maxMp:0,hit:e[4],damage:e[5],def:{melee:25,ranged:24,magic:23},speed:13+i,buffs:[],enemy:true,mark:e[2]==='melee'?'刃':e[2]==='ranged'?'弩':'咒'}));
  const start=events.length,cursors=Object.fromEntries(party.map(h=>[h.id,{prep:0,main:0}])),used=new Set();
  emit('room','进入 '+room.name+'。生命、法力、耗材继承；房间增益与战术游标重置。');
  function attempt(a,row,index,phase){const s=SKILLS[row.skill];let ts=[];let reason='';
   if(row.mode==='once'&&used.has(a.id+phase+index))reason='本场已执行一次';
   else if(a.mp<s.cost)reason='法力不足（需要 '+s.cost+'，剩余 '+a.mp+'）';
   else if(s.media&&supplies[s.media]<1)reason=SUPPLIES[s.media]+'已耗尽';
   else if(s.kind==='solve'&&(!room.seal||seal>=6))reason='没有待解读的封印';
   else if(s.kind==='solve'&&a.training.support<4)reason='辅助修习不足 4';
   else if(row.skill==='haste'&&a.training.support<5)reason='辅助修习不足 5';
   else if(s.kind==='buff'){ts=aidTargets(a,s.target||row.target).filter(t=>!t.buffs.some(b=>b.skill===row.skill&&b.until>=round)).slice(0,3);if(!ts.length)reason='没有未覆盖的存活目标';}
   else if(s.kind==='heal'){ts=aidTargets(a,row.target).filter(t=>t.hp<t.maxHp*.75).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp).slice(0,1);if(!ts.length)reason='目标位置无人低于 75% 生命';}
   else if(s.kind==='mana'){ts=aidTargets(a,row.target).filter(t=>t.id!==a.id&&t.mp<t.maxMp*.5).sort((x,y)=>x.mp/x.maxMp-y.mp/y.maxMp).slice(0,1);if(!ts.length)reason='没有法力低于 50% 的其他队友';}
   else if(s.kind==='attack'||s.kind==='weaken'){ts=targetGroup(foes,a.pos,s.kind==='weaken'?'magic':a.type,row.target);if(s.kind==='weaken')ts=ts.filter(t=>!t.buffs.some(b=>b.skill==='weaken'));ts=ts.slice(0,s.aoe||1);if(!ts.length)reason='没有合法敌人';}
   if(reason){stats[a.id].skipped++;emit('skip',a.name+' 跳过 '+s.name+'：'+reason,{phase,index:index+1,mode:row.mode,reason},a.id);return false;}
   const before=a.mp;a.mp-=s.cost;if(s.media)supplies[s.media]--;used.add(a.id+phase+index);
   const detail={skill:s.name,index:index+1,mode:row.mode,mpBefore:before,mpAfter:a.mp,media:s.media?SUPPLIES[s.media]:'无',target:s.target||row.target};
   if(s.kind==='buff'){const val=s.stat==='haste'?1:Math.round(s.value+effective(a,'support')*.45);ts.forEach(t=>{t.buffs.push({skill:row.skill,stat:s.stat,value:val,until:round+s.turns-1,source:a.id});});stats[a.id].buffs+=ts.length;emit('buff',a.name+' 使用 '+s.name+' → '+ts.map(t=>t.name).join('、')+'（+'+val+'）',{...detail,until:s.turns===99?'房间结束':'第 '+(round+s.turns-1)+' 回合结束'},a.id,ts.map(t=>t.id));}
   if(s.kind==='attack'){emit('cast',a.name+' 执行 '+s.name,{...detail,route:a.type==='melee'?ROUTES[a.pos].map(p=>POS[p]).join(' → '):'指定位置优先，无存活目标时转向其他敌人'},a.id,ts.map(t=>t.id));ts.forEach(t=>swing(a,t,a.type,s.power,s.debuff));}
   if(s.kind==='heal'){const t=ts[0],n=Math.min(t.maxHp-t.hp,Math.round(20+effective(a,'support')*1.2));t.hp+=n;stats[a.id].healing+=n;emit('heal',a.name+' 治疗 '+t.name+'，恢复 '+n+' 生命',detail,a.id,[t.id]);}
   if(s.kind==='mana'){const t=ts[0],n=Math.min(t.maxMp-t.mp,Math.round(10+effective(a,'support')*.65));t.mp+=n;stats[a.id].mana+=n;emit('mana',a.name+' 为 '+t.name+' 恢复 '+n+' 法力',detail,a.id,[t.id]);}
   if(s.kind==='weaken'){const t=ts[0];const attack=Math.round((a.attrs.int*2+effective(a,'support'))*(.65+roll()*.7)),defense=Math.round(effective(t,'magicDef')*(.65+roll()*.7));if(attack>defense)t.buffs.push({skill:'weaken',stat:'hit',value:-12,until:99,source:a.id});emit('debuff',a.name+' 对 '+t.name+' 施放迷乱：'+(attack>defense?'命中 −12':'抵抗'),{...detail,attack,defense},a.id,[t.id]);}
   if(s.kind==='solve'){seal=Math.min(6,seal+2);stats[a.id].solved+=2;emit('solve',a.name+' 解读封印，进度 '+seal+'/6',detail,a.id);}
   return true;
  }
  function action(a,phase){const rows=configs[a.id][phase];let success=false;for(let n=0;n<rows.length;n++){const i=cursors[a.id][phase]%rows.length,r=rows[i];success=attempt(a,r,i,phase);cursors[a.id][phase]=(success&&r.mode==='repeat')?i:(i+1)%rows.length;if(success)break;}
   if(!success&&phase==='main'){if(alive(foes).length)attempt(a,{skill:'basic',target:'front',mode:'standard'},-1,phase);else if(room.seal&&seal<6){const n=Math.round(a.damage);force+=n;const gain=Math.min(6-seal,Math.floor(force/60));force%=60;seal+=gain;a.hp=Math.max(0,a.hp-8);stats[a.id].taken+=8;stats[a.id].solved+=gain;emit('force',a.name+' 强行破印：累积 '+n+' 强攻，反噬 8 生命；封印 '+seal+'/6',{progress:force+'/60',reason:'敌人已清空，自动使用代价更高的替代路线'},a.id,[a.id]);}}
  }
  for(round=1;round<=12&&alive(party).length&&(alive(foes).length||room.seal&&seal<6);round++){
   [...party,...foes].forEach(u=>u.buffs=u.buffs.filter(b=>b.until>=round));stage='预备';emit('round','第 '+round+' 回合 · 预备阶段');
   const prepOrder=alive(party).sort((a,b)=>Object.keys(POS).indexOf(a.pos)-Object.keys(POS).indexOf(b.pos)||a.id.localeCompare(b.id));for(const a of prepOrder)action(a,'prep');
   if(room.hazard){stage='环境';const hazard={id:'hazard',name:'腐蚀潮气',pos:'center',hit:39,damage:10,buffs:[]};for(const t of alive(party))swing(hazard,t,'magic');}
   stage='主行动';const order=[];for(const a of [...alive(party),...alive(foes)]){const initiative=a.speed+roll()*12;const count=1+(a.buffs.some(b=>b.stat==='haste')?1:0);for(let i=0;i<count;i++)order.push({a,init:initiative/(i+1)});}order.sort((a,b)=>b.init-a.init);
   emit('initiative','主阶段行动顺序已确定',{order:order.map(x=>x.a.name+' '+x.init.toFixed(1)).join(' → ')});
   for(const {a} of order){if(a.hp<=0||!alive(party).length||!alive(foes).length&&(!room.seal||seal>=6))continue;
    if(a.enemy){const ts=targetGroup(party,a.pos,a.type,'front');const t=ts[Math.floor(roll()*ts.length)];swing(a,t,a.type);}else action(a,'main');}
  }
  round=Math.min(round-1,12);const won=alive(foes).length===0&&(!room.seal||seal>=6)&&alive(party).length>0;stage='结算';emit(won?'victory':'defeat',(won?'通过 ':'止步于 ')+room.name,{reason:won?'所有目标已完成':!alive(party).length?'队伍全员倒下':'超过 12 回合或封印未完成'});
  rooms.push({name:room.name,won,rounds:round,start,end:events.length-1,hp:party.reduce((n,h)=>n+h.hp,0),survivors:alive(party).length,supplies:copy(supplies),seal});if(!won)break;
 }
 return {version:VERSION,config:c,seed:c.seed,events,rooms,stats,party,supplies,won:rooms.length===ROOMS.length&&rooms.every(r=>r.won),cleared:rooms.filter(r=>r.won).length};
}
