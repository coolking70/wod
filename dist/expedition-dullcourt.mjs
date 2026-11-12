// A finite authored practice route, using ordinary defense/cleanse/cover rules.
const row=(skill,target='front',mode='repeat')=>({skill,target,mode});
const attrs={str:13,con:12,int:14,dex:18,cha:10,agi:14,per:14,wil:13};
const foe=(id,name,pos,hp,mp,skills,main)=>({id,name,pos,side:'enemy',role:'钝刃练场',mark:'锋',gear:'field',attrs:{...attrs},hp,maxHp:hp,mp,maxMp:mp,skills,prep:[],main,defenses:{melee:'natural',ranged:'natural',magic:'natural'},healing:{enabled:false}});
const controller=(id,name,hp,mp,level)=>({...foe(id,name,'front',hp,mp,{bluntgrip:level,strike:level-1},[row('bluntgrip'),row('strike')]),gear:'guardblade'});
export const DULLCOURT_IMAGE='assets/dullcourt-v232.svg';
export const DULLCOURT_ROOMS=[
 {id:'dullcourt_gate',name:'01 · 钝锋门庭',note:'擒制手先作无伤近战检定，命中附当前与下一回合的削势：普通物理伤害投点−4，最低0；技能等级与命中不降。盾挡/闪身可抵抗，学者可预备净化，先击倒来源也可阻止后续施放；已附状态不会因来源倒下立即消失。所有威力与遭遇参数为项目改编，不会丢失武器或永久降级。',enemies:[controller('dg-c','钝锋擒制手',130,60,8),{...foe('dg-b','门庭练卫','front',180,60,{strike:8},[row('strike')]),attrs:{...attrs,str:15,dex:13,int:7,agi:10,per:10,con:15,wil:10,cha:6}}, {...foe('dg-a','练场弩手','rear',110,50,{shot:7},[row('shot','rear')]),gear:'bow',attrs:{...attrs,dex:17,per:14,agi:12}}]},
 {id:'dullcourt_ring',name:'02 · 护锋环场',note:'后排教卫援护前排擒制手，物理抢攻可能转向实际援护者，法术拆源不触发物理援护。继续硬撑会损失物理投点；净化消耗原4法力与1符纸并占预备，可能挤占屏障和输出用料。不削弱治疗、法术或淬药魔法附段，跨房不回满。没有额外控制奖励或新装备。',enemies:[controller('dr-c','环场擒制长',160,64,9),{...foe('dr-g','护锋教卫','rear',190,64,{strike:8,interpose:8},[row('strike')]),gear:'guardblade',prep:[row('interpose','front')]}, {...foe('dr-m','练场符师','rear',125,60,{spark:7},[row('spark')]),gear:'focus',attrs:{...attrs,int:16,wil:14}}]}
];
