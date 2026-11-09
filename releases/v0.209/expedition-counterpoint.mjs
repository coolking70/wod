// Project-original short solo route. Enemies use the same optional offbeat,
// interception and ordinary round-window rules as players; no special immunity.
const row=(skill,target='front',mode='repeat')=>({skill,target,mode});
const attrs={str:12,con:12,int:13,dex:13,cha:15,agi:11,per:12,wil:13};
const unit=(id,name,pos,skill,hp,level=7)=>({id,name,pos,side:'enemy',role:'错拍回廊',mark:'拍',gear:'field',attrs:{...attrs},skills:{[skill]:level},hp,maxHp:hp,mp:80,maxMp:80,prep:[],main:[row(skill)],defenses:{melee:'natural',ranged:'natural',magic:'natural'},healing:{enabled:false}});
const singer=(id,name,pos,hp=145)=>({...unit(id,name,pos,'shot',hp),gear:'lute',skills:{offbeat:8,shot:7},main:[row('offbeat','front','round'),row('shot','rear')]});
export const COUNTERPOINT_ROOMS=[
 {id:'counterpoint_foyer',name:'01 · 迟声门廊',note:'后排迟声乐手使用与玩家相同的迟拍弦：7法力、一次普通行动，只选当前已有额外普通行动且无迟拍者；命中后只影响下一回合，基础行动和当前队列保留。指定前排无合格者时仍沿普通阵位规则回退，不靠移位自动躲开；全队都无额外行动时免费查射击后备。可以先拆后排来源、下回合预备付费净化，或少用急行节拍；每种方式都放弃其他行动或增益。',enemies:[...['cpg1','cpg2'].map(id=>({...unit(id,'廊前守卫','front','strike',135),attrs:{...attrs,armor:3}})),singer('cpvoice','迟声乐手','rear')]},
 {id:'counterpoint_stage',name:'02 · 护弦走台',note:'迟拍来源移到左翼，第2回合起检查迟拍，之前用射击后备；前排护弦者援护左翼，物理追击可能被接招，法术和心理攻击不触发。后排回声术士第3回合起一次潮汐冲击压前排。净化在先攻排队前移除迟拍，可以保留本回合额外行动，但占学者预备、法力和共享符纸；击倒已经命中过的来源不解除已有迟拍。只要还有合格者，来源会在后续普通机会重新施放，净化不是永久免疫。',enemies:[{...unit('cpguard','护弦者','front','strike',185,8),gear:'guardblade',skills:{interpose:8,strike:8},prep:[row('interpose','left')],resistances:{magic:-10}},{...singer('cplead','走台领奏','left',155),main:[{...row('offbeat','front','round'),roundWindow:{from:2,to:24}},row('shot','rear')]},{...unit('cpecho','回声术士','rear','spark',120),gear:'focus',skills:{spark:7,wave:7},main:[{...row('wave','front','once'),roundWindow:{from:3,to:24}},row('spark','front')]}]}
];
