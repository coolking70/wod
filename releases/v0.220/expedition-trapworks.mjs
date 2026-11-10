// Original finite dungeon. The special category and all stats are public before departure.
const row=(skill,target='front',mode='repeat')=>({skill,target,mode});
const attrs={str:12,con:12,int:13,dex:12,cha:10,agi:10,per:12,wil:12};
const unit=(id,name,pos,skill,hp,level=7)=>({id,name,pos,side:'enemy',role:'潮闸机廊',mark:'闸',gear:'field',attrs:{...attrs},skills:{[skill]:level},hp,maxHp:hp,mp:80,maxMp:80,prep:[],main:[row(skill)],defenses:{melee:'natural',ranged:'natural',magic:'natural'},healing:{enabled:false}});
const trap=(id,name,pos,skill,hp,target)=>({...unit(id,name,pos,skill,hp),mark:'机',mechanism:true,gear:'starterblade',attrs:{...attrs,str:8,con:8,agi:6,per:10},mp:35,maxMp:35,main:[row(skill,target)]});
export const TRAPWORKS_ROOMS=[
 {id:'trapworks_wire',name:'01 · 绞线弩廊',note:'前排绞线机弩75耐久，持续齐射后排。它只能被机巧拆解选中；其他队员先清前排巡卫/后排弩手，并按实际后排站位提供屏障和援护。拆解占射手普通行动，先输出敌人可能让机关多射一轮；拆除不撤销已经射出的弩箭。',enemies:[trap('twt','绞线机弩','front','volley',75,'rear'),unit('twg','绞线巡卫','front','strike',90),{...unit('twa','巡闸弩手','rear','shot',100),gear:'bow',main:[row('shot','rear')]}]},
 {id:'trapworks_sluice',name:'02 · 符压闸庭',note:'左翼符压喷口105耐久，用潮汐冲击压中央；后排闸庭药师只救前排守卫，不能修复机关。射手在拆解与先拆医师之间分工，队友负责前排/后排和中央保护。机关不接受普通治疗/增益，不是四类攻击免疫；全部敌人含机关清除才算通过。',enemies:[trap('tst','符压喷口','left','wave',105,'center'),{...unit('tsg','闸庭盾卫','front','strike',180,8),gear:'guardblade',skills:{strike:8,interpose:8},prep:[row('interpose','rear')]},{...unit('tsm','闸庭药师','rear','spark',130),gear:'focus',skills:{spark:7,heal:8},healing:{enabled:true,threshold:.8,target:'front',priority:'lowest'}},{...unit('tsa','闸庭弩手','right','shot',125),gear:'bow',main:[row('shot','rear')]}]}
];
