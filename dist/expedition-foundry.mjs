// Original side-dungeon content. Every pressure source is an ordinary visible
// skill, formation or resistance; there is no hidden environment damage.
const row=(skill,target='front',mode='repeat')=>({skill,target,mode});
const attrs={str:13,con:12,int:15,dex:15,cha:8,agi:12,per:13,wil:14};
const enemy=(id,name,pos,skill,hp,level=8)=>({id,name,role:'铸库守军',mark:skill==='shot'?'弩':skill==='strike'?'锤':'炉',side:'enemy',pos,defenseFocus:'resist',defenses:{melee:'natural',ranged:'natural',magic:'natural'},gear:'field',attrs:{...attrs},skills:{[skill]:level},hp,maxHp:hp,mp:80,maxMp:80,prep:[],main:[row(skill,skill==='wave'?'center':skill==='shot'?'rear':'front')],healing:{enabled:false}});
export const FOUNDRY_ROOMS=[
 {id:'foundry_gate',name:'01 · 锈链门场',note:'两名链甲守军集中前排，近战/远程抗性35%、法术弱点20%；后排弩手攻击我方后排。法术群攻可利用开场聚集，但符纸还要撑过另外三场。没有隐藏环境伤害。',enemies:[...['fg1','fg2'].map(id=>({...enemy(id,'锈链守军','front','strike',145),resistances:{melee:35,ranged:35,magic:-20}})),{...enemy('fg3','巡炉弩手','rear','shot',120),attrs:{...attrs,dex:18,per:16}}]},
 {id:'foundry_bellows',name:'02 · 风箱回廊',note:'两翼弩手分散射击后排，同位置群攻不能兼顾。后排药炉师法术抗性65%、远程弱点15%，会消耗自己的行动救护；射手切治疗者、法师处理侧翼是一个分工起点，也可先压低前线承伤。',enemies:[...['left','right'].map((pos,i)=>({...enemy('fb'+i,'风箱弩手',pos,'shot',120),attrs:{...attrs,dex:18,agi:14,per:16}})),{...enemy('fbm','药炉师','rear','shot',140,7),skills:{shot:7,heal:8},resistances:{magic:65,ranged:-15},healing:{enabled:true,threshold:.65,target:'all',priority:'lowest'}}]},
 {id:'foundry_crucible',name:'03 · 熔盐坩埚',note:'中央唤炉者远程抗性60%，会在潮卫倒下后继续召唤。前排守军与左翼术士拖住队伍，术士的法术攻击中央。击倒召唤来源会驱散其潮卫；分散与集中辅助仍有取舍。',enemies:[enemy('fcg','坩埚守军','front','strike',180,9),{...enemy('fcs','唤炉者','center','spark',160),skills:{spark:8,sentinel:8},prep:[row('sentinel','front')],resistances:{ranged:60}},{...enemy('fcw','熔盐术士','left','wave',140),attrs:{...attrs,int:18,wil:16}}]},
 {id:'foundry_vault',name:'04 · 炉心封库',note:'前排炉心监工以守势拖延；左翼护炉师持续屏障保护前排，远程抗性55%、法术弱点15%。后排余烬咏唱者法术抗性65%、远程弱点15%，群攻中央。把输出类型分给不同支援，或先稳住防线再拆除保护。',enemies:[{...enemy('fvg','炉心监工','front','strike',260,10),skills:{strike:10,guard:7},prep:[row('guard','self')]},{...enemy('fvp','护炉师','left','spark',140),skills:{spark:8,ward:8},prep:[row('ward','front')],resistances:{ranged:55,magic:-15}},{...enemy('fvc','余烬咏唱者','rear','wave',140,9),attrs:{...attrs,int:18,wil:16},resistances:{magic:65,ranged:-15}}]}
];

// Both second-room encounters use the same preparation slot. The passage is
// resolved on arrival, before applying that slot and without drawing combat RNG.
export const FOUNDRY_CHANNEL={id:'foundry_bellows',name:'02 · 冷却潮渠',note:'入渠耗2符纸。前排潮锁守卫远程抗性50%、法术弱点15%；中央两名冷却咏唱者法术抗性60%、远程弱点15%，以法术群攻我方中央。这里没有治疗者。射手群攻中央、法师拆前排是一种分工；分阵与屏障可减轻中央受压。通路费用与技能用料分别记录。',enemies:[{...enemy('fch','潮锁守卫','front','strike',170),resistances:{ranged:50,magic:-15}},...['fcm1','fcm2'].map(id=>({...enemy(id,'冷却咏唱者','center','wave',110),attrs:{...attrs,int:17,wil:15},resistances:{magic:60,ranged:-15}}))]};
export const FOUNDRY_APPROACHES={bellows:'风箱回廊',channel:'冷却潮渠',adaptive:'按抵达状态选路'};
export const FOUNDRY_PASSAGE_RULE='抵达第二场时，符纸至少4份且至少3名存活正式队员法术抗性达到10%，走潮渠并支付2符纸；否则走风箱回廊。';
export function foundryApproach(c){const choice=c.foundryApproach??'bellows';if(c.foundryApproach===null||typeof choice!=='string'||!Object.hasOwn(FOUNDRY_APPROACHES,choice))throw Error('铸库通路策略无效');return choice;}
export function foundryRooms(c){return FOUNDRY_ROOMS.map((r,i)=>i===1&&foundryApproach(c)==='channel'?FOUNDRY_CHANNEL:r);}
export function resolveFoundryPass(c,party,supplies,resistanceOf){
 const preference=foundryApproach(c),members=party.filter(u=>!u.owner&&u.hp>0&&c.heroes.some(h=>h.id===u.id)).map(u=>({id:u.id,name:u.name,magic:resistanceOf(u,'magic')})),qualified=members.filter(u=>u.magic>=10).length;
 const channel=preference==='channel'?supplies.rune>=2:preference==='adaptive'&&supplies.rune>=4&&qualified>=3,chosen=channel?'channel':'bellows',delta=channel?{rune:-2}:{},before={...supplies},after={...supplies,rune:supplies.rune+(delta.rune||0)};
 const reason=preference==='channel'?(channel?'符纸足够，按计划开启冷却潮渠；支付2符纸。':'抵达时不足2符纸，改走风箱回廊，不支付通路费用。'):preference==='adaptive'?`抵达时有${supplies.rune}符纸、${qualified}名存活正式队员法术抗性达到10%；${channel?'满足两项条件，支付2符纸进入潮渠。':'条件未同时满足，走风箱回廊，不支付通路费用。'}`:'按计划走风箱回廊，不支付通路费用。';
 return {room:channel?FOUNDRY_CHANNEL:FOUNDRY_ROOMS[1],delta,decision:{domain:'foundry',preference,chosen,reason,members,qualified,suppliesBefore:before,suppliesAfter:after,rule:preference==='adaptive'?FOUNDRY_PASSAGE_RULE:'冷却潮渠仅在抵达时有至少2符纸才执行；不足则改走风箱回廊，费用为0。'}};
}
