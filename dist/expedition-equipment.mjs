export const GEAR={field:{name:'行军装',armor:2,bonus:{}},plate:{name:'铁壁重甲',armor:6,bonus:{agi:-4}},focus:{name:'仪式法器',armor:0,bonus:{int:3}},bow:{name:'校准弓具',armor:0,bonus:{dex:3}},lute:{name:'共鸣琴',armor:1,bonus:{cha:3}}};
Object.assign(GEAR,{
 reliquaryshield:{name:"圣匣重盾",armor:2,bonus:{agi:-2,wil:2},countsAs:"plate",dungeonOnly:true},
 tidebow:{name:"潮痕长弓",armor:0,bonus:{dex:5,agi:-2},countsAs:"bow",dungeonOnly:true},
 bellfocus:{name:"沉钟残片",armor:1,bonus:{int:4,wil:2,agi:-3},countsAs:"focus",dungeonOnly:true},
 saltcloak:{name:"盐印护袍",armor:4,bonus:{wil:4,int:-3},countsAs:"focus",dungeonOnly:true},
 votivelute:{name:"祷潮古琴",armor:0,bonus:{cha:5,agi:-3},countsAs:"lute",dungeonOnly:true},
 remedybag:{name:"疗所药典",armor:0,bonus:{int:4,dex:2,agi:-3},dungeonOnly:true},
 lightplate:{name:'巡卫轻甲',armor:4,bonus:{agi:-1,str:1},countsAs:'plate'},
 scoutbow:{name:'游猎短弓',armor:1,bonus:{dex:1,agi:3},countsAs:'bow'},
 stormfocus:{name:'裂潮法器',armor:0,bonus:{int:5,wil:-3},countsAs:'focus'},
 wardfocus:{name:'护印长袍',armor:3,bonus:{wil:2,int:-2},countsAs:'focus'},
 quicklute:{name:'行旅短琴',armor:0,bonus:{cha:2,agi:3},countsAs:'lute'},
 medkit:{name:'草药师行囊',armor:1,bonus:{int:2,agi:-2}}
});

export const SLOTS={weapon:'武器',armor:'防具',accessory:'饰品'};
Object.assign(GEAR,{
 triagepin:{name:'分诊铜签',slot:'accessory',armor:0,bonus:{int:2,per:2,con:-2,wil:-1},resistances:{ranged:10,magic:-10},dungeonOnly:true},
 clockpin:{name:'潮刻怀表',slot:'accessory',armor:0,bonus:{per:3,agi:2,con:-1},resistances:{magic:5,mental:-10},dungeonOnly:true},
 filterveil:{name:'滤露面纱',slot:'accessory',armor:0,bonus:{wil:2,int:-2,agi:-1},resistances:{magic:20},dungeonOnly:true},
 counterlens:{name:'辨印晶镜',slot:'accessory',armor:0,bonus:{int:2,per:1,con:-2,wil:-1},resistances:{magic:10,mental:-10},dungeonOnly:true},
 watchmantle:{name:'哨誓披甲',slot:'armor',armor:4,bonus:{con:2,per:1,agi:-2,int:-2},resistances:{ranged:10,magic:-10},dungeonOnly:true},
 calmribbon:{name:'定心缎带',slot:'accessory',armor:0,bonus:{wil:2,agi:-2},resistances:{mental:20,magic:-10},dungeonOnly:true},
 postbell:{name:'回邮铜铃',slot:'accessory',armor:0,bonus:{agi:3,wil:1,int:-2},resistances:{ranged:5,magic:-5},dungeonOnly:true},
 watchseal:{name:'守望徽记',slot:'accessory',armor:0,bonus:{wil:3,cha:2,str:-2,dex:-2},resistances:{magic:10,ranged:-10},dungeonOnly:true},
 bellowscoat:{name:'风箱巡衣',slot:'armor',armor:2,bonus:{agi:2,int:-2},resistances:{ranged:10,magic:-10},dungeonOnly:true},
 kilngauge:{name:'炉心尺规',slot:'accessory',armor:0,bonus:{per:3,int:1,con:-1},dungeonOnly:true},
 beaconrod:{name:'引灯仪杖',slot:'weapon',armor:0,bonus:{int:3,agi:-2},resistances:{magic:10},countsAs:'focus',dungeonOnly:true},
 quaycoat:{name:'盐风哨衣',slot:'armor',armor:3,bonus:{},resistances:{ranged:15,magic:-10},dungeonOnly:true},
 tidecompass:{name:'归航罗盘',slot:'accessory',armor:0,bonus:{agi:2,per:2,con:-1},dungeonOnly:true},
 starterblade:{name:'旅人短刃',slot:'weapon',armor:0,bonus:{}},
 guardblade:{name:'卫士剑盾',slot:'weapon',armor:0,bonus:{},countsAs:'plate'},
 ritualrod:{name:'素木仪杖',slot:'weapon',armor:0,bonus:{},countsAs:'focus'},
 cloth:{name:'轻布衣',slot:'armor',armor:0,bonus:{}},
 token:{name:'公会徽记',slot:'accessory',armor:0,bonus:{}},
 scoutcharm:{name:'望哨镜片',slot:'accessory',armor:0,bonus:{per:2,wil:-2}},
 saltseal:{name:'盐晶护符',slot:'accessory',armor:0,bonus:{dex:-2},resistances:{magic:20}},
 anchorseal:{name:'锚誓指环',slot:'accessory',armor:0,bonus:{con:2,agi:-2},resistances:{melee:10},dungeonOnly:true},
 echocharm:{name:'回声耳坠',slot:'accessory',armor:0,bonus:{int:2,con:-1},resistances:{magic:10},dungeonOnly:true},
 wardpendant:{name:'疗所护符',slot:'accessory',armor:0,bonus:{wil:2,dex:-2},resistances:{ranged:15},dungeonOnly:true}
});
for(const id of ['bow','focus','lute','scoutbow','stormfocus','quicklute','reliquaryshield','tidebow','bellfocus','votivelute'])GEAR[id].slot='weapon';
for(const id of ['field','plate','lightplate','wardfocus','saltcloak']){GEAR[id].slot='armor';delete GEAR[id].countsAs;}
for(const id of ['medkit','remedybag'])GEAR[id].slot='accessory';
// Named starter/build combinations, not save migration. Each call is independent.
export function equipmentKit(id){
 const gear={weapon:'starterblade',armor:'cloth',accessory:'token'};
 const item=GEAR[id];if(!item)throw Error('未知装备组合');gear[item.slot]=id;
 if(['plate','lightplate','reliquaryshield'].includes(id)){gear.weapon=id==='reliquaryshield'?id:'guardblade';gear.armor=id==='reliquaryshield'?'plate':id;}
 if(['wardfocus','saltcloak'].includes(id))gear.weapon='ritualrod';
 return gear;
}
export const validEquipment=gear=>!!gear&&typeof gear==='object'&&!Array.isArray(gear)&&Object.keys(gear).length===3&&Object.keys(SLOTS).every(slot=>Object.hasOwn(GEAR,gear[slot])&&GEAR[gear[slot]].slot===slot);
export function equipmentItems(gear){return typeof gear==='string'?[GEAR[gear]]:Object.keys(SLOTS).map(slot=>GEAR[gear?.[slot]]);}
export function equipmentTotals(gear){const total={armor:0,bonus:{},resistances:{}};for(const item of equipmentItems(gear)){if(!item)continue;total.armor+=item.armor;for(const field of ['bonus','resistances'])for(const [k,v] of Object.entries(item[field]||{}))total[field][k]=(total[field][k]||0)+v;}return total;}
export const equipmentName=gear=>equipmentItems(gear).map(i=>i?.name||'未知装备').join(' / ');
export const sameEquipment=(a,b)=>Object.keys(SLOTS).every(slot=>a?.[slot]===b?.[slot]);
export const gearRequirementName=required=>({plate:'携盾武器',bow:'弓具类武器',focus:'法器类武器'}[required]||GEAR[required]?.name||required);
export const gearSupports=(gear,required)=>equipmentItems(gear).some(item=>item?.slot==='weapon'&&(item===GEAR[required]||item.countsAs===required));
export function replaceEquipment(gear,id){if(!validEquipment(gear)||!Object.hasOwn(GEAR,id))throw Error('装备部位无效');return {...gear,[GEAR[id].slot]:id};}
