import {CLOCKTOWER_ROOMS} from './expedition-clocktower.mjs';
import {GREENHOUSE_ROOMS} from './expedition-greenhouse.mjs';
import {SCRIPTORIUM_ROOMS} from './expedition-scriptorium.mjs';
import {PALISADE_ROOMS} from './expedition-palisade.mjs';
import {INQUEST_ROOMS} from './expedition-inquest.mjs';
import {SHOALS_SLOTS,shoalsRooms,shoalsChart} from './expedition-shoals.mjs';
import {THEATER_ROOMS} from './expedition-theater.mjs';
import {COURIER_ROOMS,courierRooms} from './expedition-courier.mjs';
import {WATCH_ROOMS} from './expedition-watch.mjs';
import {PROGRESSION_RULES,rankCost} from './expedition-progression-rules.mjs';
import {HARBOR_ROOMS,harborPlan,harborRooms} from './expedition-harbor.mjs';
import {FOUNDRY_ROOMS,foundryRooms} from './expedition-foundry.mjs';
import {GEAR,equipmentKit,gearSupports,gearRequirementName} from './expedition-equipment.mjs';
export {GEAR,gearSupports,gearRequirementName} from './expedition-equipment.mjs';
export const VERSION='0.40.0';
export const clone=x=>structuredClone(x);
export const POS={front:'前排',left:'左翼',right:'右翼',center:'中央',rear:'后排'};
export const ROLE_TARGETS={healer:'治疗者',summoner:'召唤者'};
export const roleTargetAllowed=s=>s.kind==='attack'&&s.mode==='single'&&['ranged','magic','mental'].includes(s.type);
export const positionOrderAllowed=s=>s?.kind==='attack'&&['ranged','magic','mental'].includes(s.type)&&['single','position'].includes(s.mode);
export const supportPriorityAllowed=s=>s?.kind==='buff'&&s.mode==='position'&&!s.cleanse&&!s.recall;
export const targetOptions=s=>s.kind==='transfer'?{...POS,all:'全队'}:s.cover?{...POS,...(supportPriorityAllowed(s)?{supportPriority:'按辅助阵位优先'}:{})}:s.mode==='self'?{self:'自身'}:s.mode==='all'?{all:'全队'}:s.kind==='buff'?{...POS,self:'自身',...(supportPriorityAllowed(s)?{supportPriority:'按辅助阵位优先'}:{})}:roleTargetAllowed(s)?{...POS,...ROLE_TARGETS,priority:'按个人阵位优先'}:positionOrderAllowed(s)?{...POS,priority:'按个人阵位优先'}:POS;
export const ATTR={str:'力量',con:'体质',int:'智力',dex:'灵巧',cha:'魅力',agi:'敏捷',per:'感知',wil:'意志'};
export const TYPES={melee:'近战',ranged:'远程',magic:'法术',mental:'心理'};
// Mental attacks share the existing mind-resist choice; no fourth config slot.
export const DEFENSE_TYPES={melee:TYPES.melee,ranged:TYPES.ranged,magic:'法术 / 心理'};
export const DEFENSES={natural:{name:'自然防御',cost:0,types:['melee','ranged','magic','mental']},parry:{name:'盾牌格挡',primary:'dex',secondary:'str',cost:1,types:['melee'],gear:'plate'},sidestep:{name:'闪身卸力',primary:'dex',secondary:'agi',cost:1,types:['melee']},dodge:{name:'躲避箭矢',primary:'agi',secondary:'per',cost:1,types:['ranged']},resist:{name:'心智抵抗',primary:'wil',secondary:'int',cost:2,types:['magic','mental']}};
export const naturalDefenses=()=>({melee:'natural',ranged:'natural',magic:'natural'});
export const ROOM_IDS=['harbor_gate','harbor_pass','harbor_cache','harbor_beacon','gallery','cistern','altar','infirmary','garden','heart',...FOUNDRY_ROOMS.map(r=>r.id),...WATCH_ROOMS.map(r=>r.id),...COURIER_ROOMS.map(r=>r.id),...THEATER_ROOMS.map(r=>r.id),...SHOALS_SLOTS,...INQUEST_ROOMS.map(r=>r.id),...PALISADE_ROOMS.map(r=>r.id),...SCRIPTORIUM_ROOMS.map(r=>r.id),...GREENHOUSE_ROOMS.map(r=>r.id),...CLOCKTOWER_ROOMS.map(r=>r.id)];
// All content and tuning below are original. Formula policies are documented in docs/V3_RULES.md.
export const SKILLS={
 manalink:{name:'借潮咏',kind:'transfer',primary:'cha',secondary:'wil',cost:8,mode:'position',max:1,requiresGear:'lute',desc:'吟游者自由普通技能，需乐器；占一次普通行动、8法力、无材料。所选友方阵位或全队中，按最低法力比例选择不高于50%的另一名存活正式单位；同值按队伍顺序，不给自己/召唤物，无合格者免费后备。转入min(实际支付, max(1, floor(1+施放均值×0.08)))，受目标法力上限截断，不随机检定；培养与属性影响均值，但整数档位不保证每级提高。已支付不因上限截断退款；不是生命治疗，不被仅禁草药救护的禁疗阻止，不撤销先前缺蓝、不给额外行动。'},
 strike:{name:'剑术',kind:'attack',type:'melee',primary:'dex',secondary:'str',power:1.3,cost:0,mode:'single',max:1,desc:'近战单体；按近战路线寻找目标。'},
 shot:{name:'穿石箭',kind:'attack',type:'ranged',primary:'dex',secondary:'per',power:1.2,cost:0,mode:'single',max:1,desc:'远程单体；优先指定位置。'},
 volley:{name:'齐射',kind:'attack',type:'ranged',primary:'dex',secondary:'per',power:1.1,cost:5,item:'arrow',mode:'position',max:3,desc:'同位置最多 3 人，分别检定；不跨位置补齐。'},
 wave:{name:'潮汐冲击',kind:'attack',type:'magic',primary:'int',secondary:'wil',power:1.5,cost:6,item:'rune',mode:'position',max:3,desc:'同位置最多 3 人；造成法术伤害。'},
 unravel:{name:'破印符',kind:'attack',type:'magic',primary:'int',secondary:'wil',power:.55,cost:6,item:'rune',mode:'single',max:1,requiresGear:'focus',dispel:true,desc:'学者自由普通技能；法器、6法力/1符纸，低伤害法术。先从带可破除技能增益的存活敌人中按阵位/职责选一名；没有候选免费跳过。按原攻防命中且目标仍存活时，移除最早一组同技能/同来源正面效果，含尚未生效组件；闪避不移除，伤害被吸收仍可破除。不移除负面、装备、固有属性或机关余护，不回滚本次防御、此前检定或已排定行动，不退款、不阻止来源再施放。培养影响原攻击检定/伤害，不增加移除组数。'},
 suppress:{name:'截疗符',kind:'attack',type:'magic',primary:'int',secondary:'wil',power:.65,cost:6,item:'rune',mode:'single',max:1,requiresGear:'focus',healingBlock:true,desc:'学者单体法术；需法器，消耗6法力和1符纸。命中仍存活且拥有救护技能的目标后，封锁其本回合余下的自动草药救护；目标仍可普通行动，已完成治疗不撤销。闪避不附着；命中但伤害被吸收仍可附着；同回合不叠加或延长。伤害低于微光，晚于目标行动时可能没有救护可阻。'},
 mindcall:{name:'诘心回声',kind:'attack',type:'mental',primary:'cha',secondary:'wil',power:.85,cost:6,mode:'single',max:1,requiresGear:'lute',desc:'吟游者普通心理攻击，需乐器；6法力、无共享材料，魅力/意志单体检定。可指定阵位或敌方职责；与法术共用心智抵抗选择和对应培养，命中按心理抗性减伤、物理护甲不参与。不附挫志，不偷取法力；先手击倒来源、定心吟/屏障和心理抗性都可应对，法术抗性不替代心理抗性。'},
 dissonance:{name:'挫志弦',kind:'attack',type:'magic',primary:'cha',secondary:'wil',power:.65,cost:5,mode:'single',max:1,requiresGear:'lute',weakening:true,desc:'吟游者普通技能，需乐器；5法力、无共享耗材，低伤害魅力/意志单体法术。命中未倒下者附挫志：攻击技能等级-3，持续当前与下一回合；固定削弱与期限不随训练提高，不叠加、不刷新，击倒来源不解除。影响之后的攻击命中与伤害，不影响辅助、救护、防御技能或已完成检定；闪避不附着，吸收伤害仍可附着。'},
 cleanse:{name:'清心符',kind:'buff',primary:'int',secondary:'wil',cost:4,item:'rune',mode:'position',max:3,requiresGear:'focus',cleanse:true,desc:'学者普通技能，预备阶段用4法力和1符纸，移除所选阵位最多3名存活者身上的技能负面效果；不移除增益、不复活、不回滚此前检定、不提供免疫，无负面目标免费跳过。通常下一回合才有机会净化挫志，禁疗往往已先到期。净化数量固定、不随训练提高，一次施放多人仅扣1符纸，占用本次预备行动。'},
 spark:{name:'微光',kind:'attack',type:'magic',primary:'int',secondary:'wil',power:1,cost:1,mode:'single',max:1,desc:'低消耗法术单体。'},
 interpose:{name:'援护架势',kind:'buff',primary:'con',secondary:'per',cost:5,mode:'position',max:3,cover:true,scope:'rounds',duration:1,stat:'cover',base:1,scale:0,desc:'守卫预备技能，5法力，为所选阵位最多3名其他存活友方建立当前和下一回合的援护。近战/远程攻击到来时，存活守卫若有2法力且本回合未尝试，付2法力以体质/感知和本技能作援护检定；实掷不低于本次攻击实掷×0.8向上取整才代为接招，随后仍需正常防御并承担伤害。失败也付费、计本回合一次；不足免费跳过。法术/心理不触发，不援护自己，每次攻击最多重定向一次；群攻只接一名目标的一次攻击，不取消其他目标。'},
 guard:{name:'守势',kind:'buff',primary:'con',secondary:'wil',cost:3,mode:'self',max:1,scope:'rounds',duration:1,stat:'defense',scale:0.15,base:3,desc:'自身所有防御检定提高，持续当前与下一回合。'},
 insight:{name:'灵感启蒙',kind:'buff',primary:'cha',secondary:'wil',cost:4,mode:'position',max:3,scope:'battle',stat:'int',scale:0.3,base:2,desc:'目标位置智力提高；后施放的法术辅助受益，持续本房间。'},
 ward:{name:'潮纹屏障',kind:'buff',primary:'int',secondary:'wil',cost:5,item:'rune',mode:'position',max:3,scope:'rounds',duration:2,stat:'defense',scale:0.18,base:3,desc:'目标位置所有防御检定提高；施放时按智力和技能等级取值，持续当前与之后 2 回合。'},
 mastery:{name:'战技传授',kind:'buff',primary:'cha',secondary:'per',cost:5,mode:'position',max:3,scope:'battle',stat:'skill',scale:0.18,base:1,desc:'目标位置攻击技能等级提高；同时影响命中与伤害，持续本房间。'},
 rhythm:{name:'急行节拍',kind:'buff',primary:'cha',secondary:'wil',cost:8,mode:'position',max:3,scope:'rounds',duration:1,stat:'actions',scale:0,base:1,desc:'目标位置行动次数 +1，持续当前与下一回合。'},
 provisions:{name:'远征药膳',kind:'buff',primary:'int',secondary:'wil',cost:3,item:'herb',mode:'all',max:6,scope:'expedition',stat:'armor',scale:0,base:2,desc:'全队护甲 +2，跨房间保留；同名效果仍在时跳过。'},
 mireflask:{name:'蚀潮药剂',kind:'attack',type:'magic',primary:'int',secondary:'wil',power:.45,cost:4,item:'herb',mode:'single',max:1,corrosion:true,desc:'药师自由普通技能；4法力/1药草，低伤害单体法术。命中未倒下目标后附潮蚀，之后两个回合开始各以基值6按当时法术抗性结算持续伤害，不再掷攻防或扣材料；物理护甲只参与初击。不叠加/刷新，重复攻击仍付费；闪避或击倒不附着，初击零伤仍可附着。可净化，不回滚已发生伤害；来源倒下不解除，目标倒下不再跳伤，房间结束清理。固定基值/跳数不随培养增强；与救护、药膳竞争药草，自动救护仍优先。'},
 slowcare:{name:'缓释药敷',kind:'buff',primary:'int',secondary:'wil',cost:4,item:'herb',mode:'position',max:3,components:[{label:'缓释药敷',stat:'regeneration',base:8,scale:0,scope:'rounds',duration:1,delay:1}],desc:'预备时消耗4法力、1药草，覆盖一个阵位最多3人；下一及再下一回合开始各恢复8生命，固定量不随训练提高，不能复活。首回合不能救急，同名药敷等待/生效期间不叠加；不占普通行动，不受仅限制自动草药救护的禁疗影响。'},
 groupheal:{name:'同位合剂',kind:'heal',groupHealing:true,primary:'int',secondary:'wil',cost:10,item:'herb',itemAmount:2,mode:'position',max:3,desc:'自由普通技能，仅自动救护选用；优先伤员同阵位至少2名达阈值伤员时，一次行动/10法力/2药草，为最多3人各恢复本技能均值的45%。不足人数或资源时尝试原单体救护，受禁疗限制；不复活、不跨位凑数。项目暂定参数。'},
 heal:{name:'草药救护',kind:'heal',primary:'int',secondary:'wil',cost:5,item:'herb',mode:'single',max:1,desc:'在自身行动点检查治疗阈值；触发后占用行动，不推进普通指令。'},
 cadence:{name:'蓄势合奏',kind:'buff',primary:'cha',secondary:'wil',cost:7,mode:'position',max:3,components:[{label:'抢拍',stat:'actions',base:1,scale:0,scope:'rounds',duration:0,delay:0},{label:'余韵',stat:'skill',base:3,scale:0.08,scope:'rounds',duration:1,delay:1}],desc:'同一次施放：本回合行动 +1；下一回合开始攻击技能等级提高，持续生效回合及再下一回合。所有组件结束前同名互斥。'},
 bulwark:{name:'延时护印',kind:'buff',primary:'int',secondary:'wil',cost:5,item:'rune',mode:'position',max:3,components:[{label:'符壳',stat:'armor',base:3,scale:0,scope:'rounds',duration:0,delay:0},{label:'护印展开',stat:'defenseSkill',base:4,scale:0.05,scope:'rounds',duration:1,delay:1}],desc:'当回合护甲 +3；下一回合起防御技能等级提高，持续两回合。延迟期间不占持续时间。'},
 tidearcher:{name:'唤潮弩灵',kind:'summon',primary:'int',secondary:'wil',cost:10,item:'rune',mode:'position',max:1,desc:'召唤弩灵至指定己方阵位，本房有效；基础24生命+每技能等级3生命，低于潮卫。独立以穿石箭默认优先敌方后排，可战前另选阵位或治疗者/召唤者；职责缺失每次行动用后排后备，阵位空缺按原远程路线回退，无箭矢消耗。普通召唤技能每位主人在所有形态间最多一只存活召唤物，不能叠召；主人倒下或房间结束会消散。入场只进入之后生成的行动队列。'},
 recall:{name:'潮灵归还',kind:'buff',primary:'int',secondary:'wil',cost:2,mode:'self',max:1,recall:true,desc:'预备阶段花2法力召回自己当前存活的召唤物，占本次预备；不伤主人、不影响其他主人或其他队员，不返还原召唤法力/符纸。无存活召唤物免费跳过并检查后备。可用一次指令在后续回合换形态；不能在同一行动里召回并重召，后续重召可能因缺蓝或材料失败，不会自动回滚召回。行为和成本固定，培养不增加收益。'},
 sentinel:{name:'唤潮卫',kind:'summon',primary:'int',secondary:'wil',cost:10,item:'rune',mode:'position',max:1,desc:'召唤一名潮卫至指定位置，存续本房间。普通召唤技能每位施法者在所有形态间最多一名存活召唤物；潮卫使用近战路线，召唤物独立行动、可受击，主人倒下时消散。'},
 shieldbash:{name:'盾缘重击',kind:'attack',type:'melee',primary:'str',secondary:'con',power:1.4,cost:3,mode:'single',max:1,requiresGear:'plate',ignoreArmor:3,desc:'需要携盾武器；力量/体质检定，单体近战，忽略最多3护甲。'},
 pierce:{name:'破甲重箭',kind:'attack',type:'ranged',primary:'dex',secondary:'per',power:1.45,cost:4,item:'arrow',mode:'single',max:1,requiresGear:'bow',ignoreArmor:4,desc:'需要弓具类装备；单体远程，优先指定位置，忽略最多4护甲。消耗1箭矢。'},
 lance:{name:'凝潮长枪',kind:'attack',type:'magic',primary:'int',secondary:'wil',power:2,cost:9,item:'rune',mode:'single',max:1,requiresGear:'focus',desc:'需要法器类装备；高消耗单体法术，可优先后排。对单目标集中火力，失去群体覆盖。'},
 wait:{name:'等待',kind:'wait',cost:0,desc:'主动消耗一个行动点，不消耗资源。'}
};
Object.assign(SKILLS,{
 rallyguard:{name:'集阵守护',kind:'buff',primary:'con',secondary:'wil',cost:6,mode:'position',max:3,scope:'rounds',duration:1,stat:'armor',scale:0.05,base:1,desc:'目标位置最多3人护甲提高，按施放检定取值，持续当前与下一回合；替代只保护自身的守势，但耗蓝更高。'},
 sweep:{name:'双矢连射',kind:'attack',type:'ranged',primary:'dex',secondary:'per',power:0.95,cost:3,item:'arrow',mode:'position',max:2,requiresGear:'bow',desc:'目标位置最多2人，分别检定；消耗3法力和1箭矢，比齐射省蓝但覆盖与威力更低。'},
 tidebolt:{name:'凝水矢',kind:'attack',type:'magic',primary:'int',secondary:'wil',power:1.3,cost:4,mode:'single',max:1,requiresGear:'focus',desc:'法术单体，可按敌方职责选人；消耗4法力、不消耗符纸，威力介于微光与凝潮长枪之间。'},
 foresight:{name:'先觉阵',kind:'buff',primary:'int',secondary:'per',cost:4,mode:'position',max:3,scope:'battle',stat:'agi',scale:0.15,base:2,desc:'目标位置最多3人敏捷提高，影响先攻与相应防御检定；持续本房间，不消耗符纸。'},
 resolvechant:{name:'定心吟',kind:'buff',primary:'cha',secondary:'wil',cost:4,mode:'position',max:3,scope:'battle',stat:'wil',scale:0.15,base:2,desc:'目标位置最多3人意志提高，影响心智抵抗与以意志为副属性的技能；持续本房间。'},
 poultice:{name:'防护药敷',kind:'buff',primary:'int',secondary:'wil',cost:4,item:'herb',mode:'position',max:3,scope:'rounds',duration:1,stat:'defense',scale:0.12,base:3,desc:'目标位置最多3人防御检定提高，持续当前与下一回合；占用预备行动并消耗药草，与救护争用资源。'}
});
const attrs=(str,con,int,dex,cha,agi,per,wil)=>({str,con,int,dex,cha,agi,per,wil});
const FOUNDERS=[
 {id:'a',name:'阿瑟',role:'守卫',mark:'盾',pos:'front',gear:'plate',attrs:attrs(12,16,5,11,6,8,9,12),skills:['strike','guard','shieldbash','rallyguard','interpose'],base:6},
 {id:'b',name:'莱恩',role:'射手',mark:'弓',pos:'rear',gear:'bow',attrs:attrs(9,10,5,16,6,13,15,8),skills:['shot','volley','pierce','sweep'],base:6},
 {id:'c',name:'伊芙',role:'潮术师',mark:'潮',pos:'center',gear:'focus',attrs:attrs(5,9,17,8,8,10,12,14),skills:['wave','spark','sentinel','lance','tidebolt','tidearcher','recall'],base:6},
 {id:'d',name:'维斯',role:'学者',mark:'书',pos:'center',gear:'focus',attrs:attrs(5,10,16,7,10,9,13,14),skills:['ward','spark','bulwark','foresight','suppress','cleanse','unravel'],base:6},
 {id:'e',name:'塞恩',role:'吟游者',mark:'琴',pos:'rear',gear:'lute',attrs:attrs(6,10,11,9,17,12,12,13),skills:['insight','mastery','rhythm','shot','cadence','resolvechant','dissonance','mindcall','manalink'],base:6},
 {id:'f',name:'露弥',role:'药师',mark:'药',pos:'center',gear:'field',attrs:attrs(6,12,15,8,10,10,12,15),skills:['provisions','heal','groupheal','shot','poultice','slowcare','mireflask'],base:6}
];
export const CLASS_IDS={a:'guardian',b:'ranger',c:'tidecaller',d:'scholar',e:'bard',f:'herbalist'};
export const CLASSES=Object.fromEntries(FOUNDERS.map(({id,name,...template})=>[CLASS_IDS[id],{...template,id:CLASS_IDS[id],starterId:id}]));
export const CHARACTERS=[...FOUNDERS.map(h=>({id:h.id,name:h.name,classId:CLASS_IDS[h.id],portrait:{a:'knight',b:'ranger',c:'mage',d:'scholar',e:'bard',f:'herbalist'}[h.id]})),{id:'mira',name:'米菈',classId:'scholar',portrait:'scholar',recruit:{cost:60,completed:1},story:'修复沉没档案的抄录员。可与维斯分担不同阵位的屏障与护印。'},{id:'orin',name:'奥林',classId:'herbalist',portrait:'herbalist',recruit:{cost:60,completed:2},story:'随救援船队到来的药师。可与露弥分区照护，药草仍由全队共享。'}];
export const HEROES=CHARACTERS.map(h=>({...CLASSES[h.classId],...h}));
export const STARTER_IDS=FOUNDERS.map(h=>h.id);
export function defaultHero(id){const t=HEROES.find(h=>h.id===id);if(!t)throw Error('未知角色');const h=clone(defaults().heroes.find(h=>h.id===CLASSES[t.classId].starterId));h.id=id;if(id==='mira'){h.trained='bulwark';h.prep=[row('bulwark','center')];}if(id==='orin'){h.trained='heal';h.healing.threshold=.8;}return h;}
export const row=(skill,target='front',mode='repeat')=>({skill,target,mode});
export function defaults(){return {version:VERSION,expedition:'classic',harbor:harborPlan(),bellApproach:'bypass',rescueApproach:'pass',seed:731,roomOrders:{},prepOrder:['e','d','f','a','b','c'],supplies:{herb:16,rune:22,arrow:16},heroes:FOUNDERS.map(h=>({id:h.id,training:{},item:'none',itemPolicy:{enabled:true,threshold:.3},pos:h.pos,gear:equipmentKit(h.gear),overrides:{},defenseFocus:h.id==='a'?'parry':h.id==='b'?'dodge':'resist',defenses:{...naturalDefenses(),...(h.id==='a'?{melee:'parry'}:h.id==='b'?{ranged:'dodge'}:{magic:'resist'})},trained:h.skills[0],attribute:'con',prep:h.id==='a'?[row('guard','self')]:h.id==='d'?[row('ward','front')]:h.id==='e'?[row('insight','center','once'),row('mastery','rear')]:h.id==='f'?[row('provisions','all')]:[],main:[row(h.id==='a'?'strike':h.id==='b'?'volley':h.id==='c'?'wave':h.id==='d'?'spark':'shot',h.id==='b'?'rear':'front'),...(h.id==='b'?[row('shot','rear')]:h.id==='c'?[row('spark')]:[])],healing:h.id==='f'?{enabled:true,threshold:.65,target:'all',priority:'lowest'}:{enabled:false,threshold:.65,target:'all'}}))};}
function enemy(id,name,pos,skill,health,level=7){return {id,name,role:'守誓者',mark:SKILLS[skill].type==='magic'?'咒':'刃',side:'enemy',pos,defenseFocus:'resist',defenses:naturalDefenses(),gear:'field',attrs:attrs(13,12,15,15,8,12,12,12),skills:{[skill]:level},hp:health,maxHp:health,mp:80,maxMp:80,prep:[],main:[row(skill,skill==='wave'?'center':skill==='shot'?'rear':'front')],healing:{enabled:false}};}
export const ROOMS=[
 {id:'gallery',name:'01 · 回声侧廊',note:'前排守卫掩护后排弩手。齐射只覆盖一个位置；远程可以优先消灭弩手。',enemies:[enemy('g1','石壁守卫','front','strike',150),enemy('g2','伏击弩手','rear','shot',100),enemy('g3','伏击弩手','rear','shot',100)]},
 {id:'cistern',name:'02 · 浸潮蓄水厅',note:'两名祭司攻击中央，战斗之间不回复生命和法力。治疗会占用药师的行动。',enemies:[enemy('c1','溺水守卫','front','strike',180),enemy('c2','蚀潮祭司','rear','wave',130),enemy('c3','蚀潮祭司','rear','wave',130)]},
 {id:'altar',name:'03 · 守誓圣坛',note:'守誓者先施放守势；敌我使用相同技能规则。保留资源、准备备用指令，避免空过行动。',enemies:[{...enemy('s1','守誓者','front','strike',300,10),skills:{strike:8,guard:6},prep:[row('guard','self')]},enemy('s2','誓约残影','rear','wave',160,9)]}
];

export const PLAN_FIELDS=['supportOrder','attackOrder','pos','prep','main','healing','defenses','itemPolicy'];
export function resolveHeroPlan(h,roomId){const plan=clone(h);for(const k of PLAN_FIELDS)if(Object.hasOwn(h.overrides?.[roomId]||{},k))plan[k]=clone(h.overrides[roomId][k]);return plan;}
export function migrateConfig(raw){const c=clone(raw);if(c?.version==='0.3.0'){c.version='0.4.0';c.roomOrders={};for(const h of c.heroes){h.overrides={};h.defenses=naturalDefenses();h.defenseFocus=h.id==='a'?'parry':h.id==='b'?'dodge':'resist';}}if(c?.version==='0.4.0'){c.version='0.5.0';c.expedition='classic';for(const h of c.heroes){h.item='none';h.itemPolicy={enabled:true,threshold:.3};}}if(c?.version==='0.5.0')c.version='0.6.0';if(c?.version==='0.6.0'){c.version='0.7.0';for(const h of c.heroes)h.training={};}if(c?.version==='0.7.0')c.version='0.8.0';if(c?.version==='0.8.0'){c.version='0.11.0';c.bellApproach='bypass';}if(c?.version==='0.10.0')c.version='0.11.0';if(c?.version==='0.11.0'){c.version=VERSION;c.rescueApproach??='pass';}if(['0.12.0','0.14.0','0.20.0','0.23.0'].includes(c?.version))c.version=VERSION;return c;}

export const ITEMS={none:{name:'不携带',charges:0},tonic:{name:'凝潮药瓶',charges:2,resource:'mp',amount:24,desc:'法力低于阈值时自用，恢复24法力；整次远征2次。'},salve:{name:'救急药匣',charges:2,resource:'hp',amount:40,desc:'生命低于阈值时自用，恢复40生命；整次远征2次。'}};
export const EXPEDITIONS={clocktower:{name:'潮刻钟楼 · 蓄势与急拍'},greenhouse:{name:'蚀潮温室 · 持续侵蚀与净化'},scriptorium:{name:'逆印书库 · 敌方破印与重施'},palisade:{name:'折潮哨垒 · 敌方援护与拆援'},inquest:{name:'镜心问堂 · 心理攻防'},shoals:{name:"漂流群礁 · 有限海图远征"},theater:{name:"失声剧场 · 削弱与净化"},courier:{name:"灯塔后续 · 沉船邮路"},foundrywatch:{name:"铸库后续 · 封库守望"},foundry:{name:"锈潮铸库 · 四场连续支线"},harbor:{name:"第二章 · 盐风港的无光灯塔"},seasoned:{name:'熟练试炼 · 裂潮哨站'},veteran:{name:'资深试炼 · 沉钟议庭'},tutorial:{name:'初次出征 · 回声侧廊'},chapter:{name:'第一章 · 沉钟之下'},classic:{name:'修道院 · 基线远征'},vigil:{name:'潮汐异变 · 战术挑战'},archive:{name:'封库试炼 · 敌情与克制'},scarcity:{name:'断潮封库 · 限时补给挑战'},survival:{name:'守灯归途 · 生存试炼'},hospice:{name:'溺潮疗所 · 切断支援'}};
const vigil=clone(ROOMS);
vigil[0].note='前排两名护卫掩护后排召潮者。召潮者每次存活潮卫被击倒后可再次召唤；远程集中后排可以切断召唤来源。';
vigil[0].enemies=[enemy('vg1','潮壳护卫','front','strike',160),enemy('vg2','潮壳护卫','front','strike',160),{...enemy('vg3','召潮者','rear','spark',150),skills:{spark:7,sentinel:7},prep:[row('sentinel','front')]}];
vigil[1].note='两名祭司用群体法术压制中央。分散站位可减少覆盖，但也会失去集中辅助；进入此房间后可独立调整屏障和防御。';
vigil[1].enemies=[enemy('vc1','潮闸巨卫','front','strike',230),enemy('vc2','深潮祭司','rear','wave',160,10),enemy('vc3','深潮祭司','rear','wave',160,10)];
vigil[2].note='守誓者生命不高于一半且仍存活时碎印：召来两名潮卫，后续普通行动改为压制后排的法术。击倒主人会同时驱散其召唤物。请为此房间保留法力与药瓶。';
vigil[2].enemies=[{...enemy('vs1','碎印守誓者','front','strike',480,10),skills:{strike:10,wave:10,guard:6},prep:[row('guard','self')],awakens:true},enemy('vs2','誓约祭司','rear','spark',140,8)];
export function roomsFor(c){return (c.expedition==='clocktower'?CLOCKTOWER_ROOMS:c.expedition==='greenhouse'?GREENHOUSE_ROOMS:c.expedition==='scriptorium'?SCRIPTORIUM_ROOMS:c.expedition==='palisade'?PALISADE_ROOMS:c.expedition==='inquest'?INQUEST_ROOMS:c.expedition==='shoals'?shoalsRooms(c):c.expedition==='theater'?THEATER_ROOMS:c.expedition==='courier'?courierRooms(c):c.expedition==='foundrywatch'?WATCH_ROOMS:c.expedition==='foundry'?foundryRooms(c):c.expedition==='harbor'?harborRooms(c):null)||trials[c.expedition]||(c.expedition==='tutorial'?ROOMS.slice(0,1):c.expedition==='chapter'?chapter:c.expedition==='hospice'?hospice:c.expedition==='survival'?survival:hasArchiveEvents(c)?archive:c.expedition==='vigil'?vigil:ROOMS);}
export function challengeConfig(){const c=defaults();c.expedition='vigil';for(const h of c.heroes){h.item=['c','d','e','f'].includes(h.id)?'tonic':'salve';h.itemPolicy.threshold=h.item==='tonic'?.3:.5;}c.heroes.find(h=>h.id==='c').prep=[row('sentinel','front')];c.heroes.find(h=>h.id==='d').overrides.cistern={prep:[row('ward','center')]};for(const id of ['b','e']){const h=c.heroes.find(h=>h.id===id);h.overrides.altar={defenses:{...h.defenses,magic:'resist'}};}return c;}

export {rankCost} from './expedition-progression-rules.mjs';
export const MAX_TRAINING_RANK=PROGRESSION_RULES.training.maxRank;
export const trainingCost=training=>Object.values(training).reduce((n,v)=>n+rankCost(v),0);
export function trainingOptions(heroId){const h=HEROES.find(h=>h.id===heroId);return Object.fromEntries([...h.skills.map(id=>['skill:'+id,{name:SKILLS[id].name,kind:'skill',id}]),...Object.keys(DEFENSES).filter(id=>id!=='natural').map(id=>['defense:'+id,{name:DEFENSES[id].name,kind:'defense',id}])]);}
export function trainingBuild(kind='balanced'){const c=challengeConfig();for(const h of c.heroes){if(kind==='defense')h.training={['defense:'+h.defenseFocus]:3};else if(kind==='support')h.training={['skill:'+({a:'guard',b:'volley',c:'sentinel',d:'ward',e:'insight',f:'heal'}[h.id])]:3};else h.training={['skill:'+h.trained]:2,['defense:'+h.defenseFocus]:2};}return c;}

// Three fixed encounters, using the same stage IDs for shared room-plan slots.
const archive=[
 {id:'gallery',name:'01 · 铁壳门廊',note:'两名重甲卫士集中前排，近战与远程抗性35%，法术弱点25%。群体法术可覆盖两人；破甲只忽略固定护甲，不绕过抗性。后排弩手持续射击后排。',enemies:[
  ...['ag1','ag2'].map(id=>({...enemy(id,'铁壳卫士','front','strike',175,8),attrs:{...enemy(id,'','front','strike',1).attrs,armor:10},resistances:{melee:35,ranged:35,magic:-25}})),
  enemy('ag3','封库弩手','rear','shot',110,8)]},
 {id:'cistern',name:'02 · 镜潮回廊',note:'三名咏唱者集中中央，法术抗性60%，远程弱点20%。屏障由镜潮司仪维持；远程可优先射击中央或后排。继续大量施法会消耗后续房间所需法力与符纸。',enemies:[
  ...['ac1','ac2','ac3'].map(id=>({...enemy(id,'镜潮咏唱者','center','spark',110,7),resistances:{magic:60,ranged:-20}})),
  {...enemy('ac4','镜潮司仪','rear','spark',130,7),skills:{spark:7,ward:6},prep:[row('ward','center')],resistances:{magic:60,ranged:-20}}]},
 {id:'altar',name:'03 · 分誓封印',note:'三名守印者分居前排、左翼、右翼。同位置群攻最多命中一人；单体重箭与凝潮长枪可集中火力。后排护印师为前排展开延时防护，补给与生命仍从前两房继承。',enemies:[
  ...[['aa1','front'],['aa2','left'],['aa3','right']].map(([id,pos])=>enemy(id,'分誓守印者',pos,'strike',160,8)),
  {...enemy('aa4','封库护印师','rear','wave',130,8),skills:{wave:8,bulwark:6},prep:[row('bulwark','front')]}]}
];
export function archiveConfig(adapted=false){
 const c=trainingBuild();c.expedition='archive';c.roomOrders={};
 for(const h of c.heroes)h.overrides={};
 c.heroes.find(h=>h.id==='c').prep=[];
 c.heroes.find(h=>h.id==='d').prep=[row('ward','front')];
 if(adapted){
  c.heroes.find(h=>h.id==='b').overrides={cistern:{main:[row('volley','center'),row('shot','center')]},altar:{main:[row('pierce','front'),row('shot','front')]}};
  c.heroes.find(h=>h.id==='c').overrides={cistern:{main:[row('spark','rear')]},altar:{main:[row('lance','front'),row('spark','front')]}};
 }
 return c;
}

export const hasArchiveEvents=c=>['archive','scarcity','chapter'].includes(c.expedition);
export const supplyBudget=c=>c.expedition==='veteran'?30:['scarcity','theater','inquest'].includes(c.expedition)?24:['clocktower','greenhouse','scriptorium','palisade','shoals','foundry','foundrywatch','courier'].includes(c.expedition)?30:['survival','hospice','seasoned','harbor'].includes(c.expedition)?36:60;
export function roomTimeBudget(c,roomId){return c.expedition==='scarcity'?5-(roomId==='cistern'&&c.rescueApproach==='gather'?1:0):24;}
export function scarcityConfig(adapted=false){const c=archiveConfig(adapted);c.expedition='scarcity';c.supplies={herb:8,rune:8,arrow:8};return c;}

// Original survival encounters. All pressure comes from visible enemy commands/stats.
const survival=[
 {id:'gallery',name:'01 · 狙灯栈桥',note:'两名猎灯弩手优先射击后排，前排护卫掩护。后排不是安全区；屏障、远程防御和集火弩手都可改变承伤。',enemies:[enemy('lg1','栈桥护卫','front','strike',190,9),...['lg2','lg3'].map(id=>({...enemy(id,'猎灯弩手','rear','shot',170,15),attrs:attrs(13,12,15,22,8,16,19,12)}))]},
 {id:'cistern',name:'02 · 碎灯礼堂',note:'两名熄灯祭司用潮汐冲击覆盖中央，最多各命中3人。分散能减少群攻覆盖，但会分散启蒙和屏障收益；移空中央不会阻止敌人按规则寻找下一个非空阵位。',enemies:[enemy('lc1','礼堂护卫','front','strike',210,10),...['lc2','lc3'].map(id=>({...enemy(id,'熄灯祭司','rear','wave',190,15),attrs:attrs(13,12,23,15,8,14,12,19)}))]},
 {id:'altar',name:'03 · 最后一盏灯',note:'弩手压制后排，祭司压制中央，前排灯狱守卫拖住近战。生命与法力跨房间保留，药师在自己的行动点才能治疗；倒下者不会随换房复活。',enemies:[enemy('la1','灯狱守卫','front','strike',280,12),{...enemy('la2','猎灯队长','rear','shot',190,16),attrs:attrs(13,12,15,23,8,16,20,12)},{...enemy('la3','熄灯主祭','center','wave',200,16),attrs:attrs(13,12,24,15,8,14,12,20)}]}
];
export function survivalConfig(kind='baseline'){
 if(!['baseline','formation','medic','combined'].includes(kind))throw Error('未知守灯方案');
 const c=archiveConfig();c.expedition='survival';c.supplies={herb:12,rune:12,arrow:12};c.seed=1;
 if(['formation','combined'].includes(kind)){
  c.heroes.find(h=>h.id==='d').overrides.gallery={prep:[row('ward','rear')]};
  c.heroes.find(h=>h.id==='e').overrides.gallery={defenses:{...c.heroes.find(h=>h.id==='e').defenses,ranged:'dodge'}};
  for(const room of ['cistern','altar']){
   c.heroes.find(h=>h.id==='c').overrides[room]={pos:'left'};
   c.heroes.find(h=>h.id==='f').overrides[room]={pos:'right'};
   c.heroes.find(h=>h.id==='d').overrides[room]={prep:[row('ward','center')]};
  }
 }
 if(['medic','combined'].includes(kind)){
  const h=c.heroes.find(h=>h.id==='f');h.trained='heal';h.training={'skill:heal':3};h.healing.threshold=.8;
 }
 return c;
}

// Enemy support uses the same action, mana, healing and summon rules as the party.
const caller=id=>({...enemy(id,'引潮司祭','rear','spark',180,9),skills:{spark:9,sentinel:9},prep:[row('sentinel','front')]});
const nurse=id=>({...enemy(id,'护潮药师','rear','spark',170,8),skills:{spark:8,heal:11},healing:{enabled:true,threshold:.8,target:'all',priority:'lowest'}});
const hospice=[
 {id:'gallery',name:'01 · 引潮病廊',note:'引潮司祭在后排，每次存活潮卫倒下后可再次召唤；每次消耗10法力与1符纸。击倒司祭会驱散其存活潮卫。只打前排会让支援者继续行动。',enemies:[enemy('hg1','病廊重卫','front','strike',230,10),caller('hg2')]},
 {id:'cistern',name:'02 · 不息药庭',note:'后排护潮药师在自身行动点治疗生命比例最低且不高于80%的伤员；每次消耗5法力与1药草，替代普通攻击。两名重卫集中前排，群攻可一起压低生命，也可能让药师持续救护。',enemies:[enemy('hc1','药庭重卫','front','strike',220,11),enemy('hc2','药庭重卫','front','strike',220,11),nurse('hc3')]},
 {id:'altar',name:'03 · 双灯心室',note:'司祭在中央、药师在后排，重卫挡住前排。集中中央可切断召唤，集中后排可阻止治疗，但无法用一次同位置群攻同时覆盖两位支援者。生命、法力与补给继承。',enemies:[enemy('ha1','心室重卫','front','strike',310,12),{...caller('ha2'),pos:'center'},nurse('ha3')]}
];
export function hospiceConfig(kind='front'){
 if(!['front','source','sustain'].includes(kind))throw Error('未知疗所方案');
 const c=archiveConfig();c.expedition='hospice';c.seed=1;c.supplies={herb:12,rune:12,arrow:12};
 for(const id of ['b','c']){const h=c.heroes.find(h=>h.id===id);h.main=[row(id==='b'?'pierce':'lance','front'),row(id==='b'?'shot':'spark','front')];
  if(kind!=='front')for(const room of ['gallery','cistern','altar']){const target=room==='altar'?'center':'rear';h.overrides[room]={main:h.main.map(r=>({...r,target}))};}
 }
 if(kind==='sustain'){const h=c.heroes.find(h=>h.id==='f');h.trained='heal';h.training={'skill:heal':3};h.healing.threshold=.8;}
 return c;
}

export function roleHuntConfig(first='healer'){
 if(!Object.hasOwn(ROLE_TARGETS,first))throw Error('未知优先职责');
 const c=hospiceConfig('source');
 for(const id of ['b','c']){const h=c.heroes.find(h=>h.id===id);h.overrides={};h.main=[row(id==='b'?'pierce':'lance',first),row(id==='b'?'pierce':'lance',first==='healer'?'summoner':'healer'),row(id==='b'?'shot':'spark','front')];}
 return c;
}

const chapter=[...clone(archive),...clone(hospice).map((r,i)=>({...r,id:['infirmary','garden','heart'][i],name:['04 · 引潮病廊','05 · 不息药庭','06 · 双灯心室'][i]}))];
export function tutorialConfig(){const c=defaults();c.expedition='tutorial';c.seed=1;return c;}
export function chapterConfig(){
 const c=archiveConfig(true);c.expedition='chapter';c.seed=1;c.supplies={herb:16,rune:24,arrow:20};c.rescueApproach='aid';c.bellApproach='study';
 for(const id of ['b','c'])for(const room of ['infirmary','garden','heart']){const h=c.heroes.find(h=>h.id===id);h.overrides[room]={main:[row(id==='b'?'pierce':'lance','healer'),row(id==='b'?'pierce':'lance','summoner'),row(id==='b'?'shot':'spark','front')]};}
 return c;
}

// Stage challenges use distinct enemy formations instead of multiplying every stat.
const watchArcher=(id,pos)=>({...enemy(id,'猎灯弩手',pos,'shot',175,11),main:[row('shot','rear')],attrs:attrs(9,10,5,18,6,15,17,10)});
const wardCaptain=id=>({...enemy(id,'铁潮旗卫','front','strike',330,11),gear:'plate',skills:{strike:11,guard:8},prep:[row('guard','self')],attrs:attrs(16,18,6,14,7,9,12,14)});
const trials={
 seasoned:[
 {id:'gallery',name:'01 · 猎灯射廊',note:'后排弩手优先射击我方后排。只保护前排无法覆盖射手和吟游者；检查后排防御与救护，远程单体可以先处理弩手。',enemies:[wardCaptain('sg1'),watchArcher('sg2','rear')]},
 {id:'cistern',name:'02 · 分灯救所',note:'药师在后排且法术抗性70%，召唤者在中央且远程抗性60%。射手处理药师，法师处理召唤者；给两人相同职责目标未必有效。',enemies:[enemy('sc1','救所守卫','front','strike',230,11),{...nurse('sc2'),hp:210,maxHp:210,resistances:{magic:70}},{...caller('sc3'),pos:'center',hp:210,maxHp:210,resistances:{ranged:60}}]},
 {id:'altar',name:'03 · 破甲门庭',note:'重甲旗卫挡在前排，药师在后排、弩手在左翼。群攻无法同时覆盖三个位置；先切断治疗，再以破甲攻击处理旗卫。',enemies:[{...wardCaptain('sa1'),hp:390,maxHp:390},{...nurse('sa2'),hp:195,maxHp:195},watchArcher('sa3','left')]}
 ],
 veteran:[
 {id:'gallery',name:'01 · 双翼伏弩',note:'两名弩手分列左右翼并射击后排；一次同位置群攻无法兼顾。治疗与防御的消耗会延续到后两场，避免在开场耗尽法力。',enemies:[wardCaptain('vg29a'),watchArcher('vg29b','left'),watchArcher('vg29c','right')]},
 {id:'cistern',name:'02 · 镜潮议席',note:'中央群攻施法者与后排高法抗药师协作；我方中央堆叠会让群攻覆盖更多人。可调整站位，并由射手切断治疗。',enemies:[enemy('vc29a','议席重卫','front','strike',270,12),{...enemy('vc29b','镜潮审议者','center','wave',230,12),main:[row('wave','center'),row('spark','rear')],skills:{wave:12,spark:10}},{...nurse('vc29c'),hp:240,maxHp:240,resistances:{magic:75}}]},
 {id:'altar',name:'03 · 三席合议',note:'旗卫、召唤者、药师分别处于前排、中央和后排。药师抗法、召唤者抗远程；长期续航与分工集火同时受考验，保留低消耗备用指令。',enemies:[{...wardCaptain('va29a'),hp:450,maxHp:450},{...caller('va29b'),pos:'center',hp:250,maxHp:250,resistances:{ranged:65}},{...nurse('va29c'),hp:250,maxHp:250,resistances:{magic:75}}]}
 ]
};
export function trialConfig(route='seasoned',plan='roles'){
 if(!['seasoned','veteran'].includes(route)||!['front','roles','adapted'].includes(plan))throw Error('未知阶段试炼方案');
 const c=roleHuntConfig('healer');c.expedition=route;c.seed=1;c.supplies=route==='seasoned'?{herb:12,rune:12,arrow:12}:{herb:10,rune:10,arrow:10};
 for(const h of c.heroes)h.overrides={};
 if(plan==='front')for(const id of ['b','c']){const h=c.heroes.find(h=>h.id===id);h.main=h.main.map(r=>({...r,target:'front'}));}
 if(plan==='adapted'){
 const b=c.heroes.find(h=>h.id==='b'),m=c.heroes.find(h=>h.id==='c'),d=c.heroes.find(h=>h.id==='d'),f=c.heroes.find(h=>h.id==='f');
 b.main=[row('pierce','healer'),row('shot','rear')];m.main=[row('lance','summoner'),row('spark','front')];
 b.overrides.gallery={main:[row('pierce',route==='veteran'?'left':'rear'),row('shot',route==='veteran'?'right':'rear')]};m.overrides.gallery={main:[row('lance',route==='veteran'?'right':'rear'),row('spark',route==='veteran'?'left':'rear')]};
 d.prep=[row('ward','rear')];f.healing.threshold=.8;
 if(route==='veteran'){d.pos='left';f.pos='right';}
 }
 return c;
}

export function harborConfig(){const c=defaults();c.expedition='harbor';c.supplies={herb:12,rune:14,arrow:10};for(const h of c.heroes){h.item=['c','d','e','f'].includes(h.id)?'tonic':'salve';h.itemPolicy.threshold=h.item==='tonic'?.3:.5;}c.heroes[1].main=[row('pierce','healer'),row('shot','rear')];c.heroes[2].main=[row('wave','rear'),row('spark','rear')];c.heroes[3].overrides.harbor_pass={prep:[row('ward','rear')]};return c;}

// No experience, equipment or course is granted by this tactical starting plan.
export function foundryConfig(plan='split'){
 if(!['plain','split','shelter'].includes(plan))throw Error('未知铸库方案');
 const c=defaults();c.expedition='foundry';c.foundryFlow='cooling-1';c.supplies={herb:10,rune:10,arrow:10};
 for(const h of c.heroes){h.item=['c','d','e','f'].includes(h.id)?'tonic':'salve';h.itemPolicy.threshold=h.item==='tonic'?.3:.5;}
 if(plan==='plain')return c;
 const get=id=>c.heroes.find(h=>h.id===id),a=get('a'),b=get('b'),mage=get('c'),d=get('d'),e=get('e'),f=get('f');
 a.trained='guard';a.main=[row('shieldbash'),row('strike')];b.trained='pierce';mage.trained='lance';d.trained='ward';f.trained='heal';
 b.main=[row('pierce','front','once'),row('shot','front')];mage.prep=[];mage.main=[row('wave','front','once'),row('spark','front')];d.prep=[row('ward','front','once')];
 b.overrides.foundry_bellows={main:[row('pierce','healer'),row('shot','left')]};mage.overrides.foundry_bellows={main:[row('spark','right')]};
 mage.overrides.foundry_crucible={main:[row('lance','summoner','once'),row('spark','summoner'),row('spark','front')]};
 b.overrides.foundry_vault={main:[row('pierce','rear','once'),row('shot','rear')]};mage.overrides.foundry_vault={main:[row('lance','left','once'),row('spark','left')]};
 if(plan==='shelter'){
  mage.pos='left';f.pos='right';e.prep=[row('insight','left','once'),row('mastery','rear','once')];d.prep=[row('ward','rear','once')];
 }
 return c;
}

export function watchConfig(plan='split'){
 if(!['plain','split','shelter'].includes(plan))throw Error('未知守望方案');
 const c=foundryConfig(plan);c.expedition='foundrywatch';delete c.foundryFlow;
 for(const h of c.heroes)h.overrides={};
 if(plan==='plain')return c;
 const get=id=>c.heroes.find(h=>h.id===id),a=get('a'),b=get('b'),mage=get('c'),d=get('d');
 a.main=[row('shieldbash','front','once'),row('strike')];
 b.main=[row('pierce','healer','once'),row('shot','healer'),row('shot','front')];
 b.overrides.watch_chain={main:[row('pierce','right','once'),row('shot','right')]};mage.overrides.watch_chain={main:[row('lance','left','once'),row('spark','left')]};d.overrides.watch_chain={prep:[row('ward','center','once')]};
 mage.overrides.watch_heart={main:[row('lance','summoner','once'),row('spark','summoner'),row('spark','right')]};
 return c;
}

export function courierConfig(plan='rhythm'){
 if(!['plain','rhythm','ward'].includes(plan))throw Error('未知邮路方案');
 const c=foundryConfig(plan==='plain'?'plain':'split');c.expedition='courier';delete c.foundryFlow;c.supplies={herb:12,rune:10,arrow:8};for(const h of c.heroes)h.overrides={};
 if(plan==='plain')return c;
 const get=id=>c.heroes.find(h=>h.id===id),a=get('a'),b=get('b'),mage=get('c'),d=get('d'),e=get('e'),f=get('f');a.main=[row('shieldbash','front','round'),row('strike')];mage.pos='left';f.pos='right';d.pos='rear';e.pos='center';e.item='salve';e.itemPolicy.threshold=.7;e.defenses.magic='resist';e.defenseFocus='resist';e.prep=[row('insight','left','once'),row('mastery','rear','once')];
 f.healing.threshold=.8;b.main=[row('pierce','rear','once'),row('shot','rear')];b.overrides.courier_sails={main:[row('pierce','rear','round'),row('shot','rear')]};mage.overrides.courier_sails={main:[row('lance','left','once'),row('spark','left'),row('spark','right')]};d.overrides.courier_sails={prep:[row('ward','center')]};
 b.overrides.courier_seal={main:[row('pierce','healer','once'),row('shot','healer'),row('shot','rear')]};mage.overrides.courier_seal={main:[row('lance',plan==='ward'?'center':'left','once'),row('spark',plan==='ward'?'center':'left'),row('spark',plan==='ward'?'left':'center')]};
 return c;
}

export function theaterConfig(plan='cleanse'){
 if(!['plain','cleanse','pressure'].includes(plan))throw Error('未知剧场方案');
 const c=defaults();c.expedition='theater';c.supplies={herb:9,rune:9,arrow:6};
 const a=c.heroes.find(h=>h.id==='a'),b=c.heroes.find(h=>h.id==='b'),mage=c.heroes.find(h=>h.id==='c'),d=c.heroes.find(h=>h.id==='d'),e=c.heroes.find(h=>h.id==='e'),f=c.heroes.find(h=>h.id==='f');
 a.main=[row('shieldbash','front','round'),row('strike')];b.main=[row('pierce','rear','round'),row('shot','rear')];mage.main=[row('wave','front','once'),row('spark','front')];f.healing.threshold=.8;e.pos='rear';f.pos='right';
 if(plan==='plain')return c;
 if(plan==='cleanse')d.prep=[row('cleanse','front'),row('ward','front','cycle')];
 if(plan==='cleanse')d.overrides.theater_choir={prep:[row('cleanse','center'),row('ward','center','cycle')]};
 if(plan==='pressure'){mage.overrides.theater_choir={main:[row('lance','left','once'),row('spark','left')]};e.main=[row('dissonance','front','round'),row('shot','front')];d.prep=[row('ward','front')];d.overrides.theater_choir={prep:[row('ward','center')]};}
 return c;
}

export function shoalsConfig(plan='roles',chart=1){
 if(!['plain','roles'].includes(plan))throw Error('未知漂礁方案');
 const c=defaults();c.expedition='shoals';c.shoalsChart=chart;c.supplies={herb:11,rune:10,arrow:9};const map=shoalsChart(c);
 if(plan==='plain')return c;
 for(const h of c.heroes){const kind=HEROES.find(t=>t.id===h.id).classId;if(kind==='guardian')h.main=[row('shieldbash','front','round'),row('strike')];if(kind==='scholar')h.pos='left';if(kind==='herbalist'){h.pos='right';h.healing.threshold=.8;}
  for(const [i,node] of map.nodes.entries()){const rows=node.tactics[kind];if(rows)h.overrides[SHOALS_SLOTS[i]]={[kind==='scholar'?'prep':'main']:clone(rows)};}
 }
 return c;
}

export function inquestConfig(plan='pressure'){
 if(!['plain','pressure','composure'].includes(plan))throw Error('未知问堂方案');
 const c=theaterConfig('plain');c.expedition='inquest';
 const get=id=>c.heroes.find(h=>h.id===id),a=get('a'),mage=get('c'),d=get('d'),e=get('e');
 d.overrides.inquest_seat={prep:[row('ward','center')]};
 if(plan==='plain')return c;
 e.main=[row('mindcall','front','round'),row('shot','front')];e.overrides.inquest_seat={main:[row('mindcall','rear','round'),row('shot','rear')]};
 if(plan==='composure'){a.defenses.magic='resist';mage.defenses.magic='resist';d.defenses.magic='resist';e.prep=[row('resolvechant','front','once'),row('insight','center','once')];e.overrides.inquest_seat.prep=[row('resolvechant','center','once'),row('mastery','rear','once')];}
 return c;
}

export function palisadeConfig(plan='break'){
 if(!['plain','break','bypass'].includes(plan))throw Error('未知哨垒方案');
 const c=defaults();c.expedition='palisade';c.supplies={herb:12,rune:10,arrow:8};
 const get=id=>c.heroes.find(h=>h.id===id),a=get('a'),b=get('b'),mage=get('c'),d=get('d'),e=get('e'),f=get('f');
 for(const h of c.heroes){h.item=['a','b'].includes(h.id)?'salve':'tonic';h.itemPolicy.threshold=h.item==='salve'?.5:.3;}
 a.main=[row('shieldbash','front','round'),row('strike')];b.main=[row('pierce','rear','round'),row('shot','rear')];mage.main=[row('wave','front','once'),row('spark','front')];f.healing.threshold=.8;e.defenses.ranged='dodge';d.overrides.palisade_crossfire={prep:[row('ward','rear')]};d.overrides.palisade_command={prep:[row('ward','center')]};
 if(plan==='plain')return c;
 e.trained='mindcall';e.main=[row('mindcall','front','round'),row('shot','front')];b.overrides.palisade_crossfire={main:[row('pierce','rear','round'),row('shot','rear')]};e.overrides.palisade_crossfire={main:[row('mindcall','rear','round'),row('shot','rear')]};
 if(plan==='break'){b.main=[row('pierce','front','round'),row('shot','front')];b.overrides.palisade_command={main:[row('pierce','left','round'),row('shot','left')]};e.overrides.palisade_command={main:[row('mindcall','healer','round'),row('shot','rear')]};}
 if(plan==='bypass'){a.trained='interpose';a.prep=[row('interpose','rear')];b.main=[row('pierce','healer','round'),row('shot','healer'),row('shot','rear')];mage.main=[row('lance','healer','once'),row('spark','healer'),row('spark','front')];mage.overrides.palisade_crossfire={main:[row('wave','front','once'),row('spark','front')]};e.main=[row('mindcall','healer','round'),row('shot','rear')];}
 return c;
}

export function scriptoriumConfig(plan='source'){
 if(!['source','lean','renew'].includes(plan))throw Error('未知逆印书库方案');
 const c=defaults();c.expedition='scriptorium';c.supplies={herb:12,rune:10,arrow:8};
 const get=id=>c.heroes.find(h=>h.id===id),a=get('a'),b=get('b'),mage=get('c'),d=get('d'),e=get('e'),f=get('f');
 for(const h of c.heroes){h.item=['a','b'].includes(h.id)?'salve':'tonic';h.itemPolicy.threshold=h.item==='salve'?.5:.3;}
 a.main=[row('shieldbash','front','round'),row('strike')];b.main=[row('pierce','rear','round'),row('shot','rear')];mage.main=[row('lance','rear','once'),row('spark','rear')];e.trained='mindcall';e.main=[row('mindcall','front','round'),row('shot','rear')];f.healing.threshold=.8;
 b.overrides.scriptorium_stair={main:[row('pierce','left','round'),row('shot','left')]};mage.overrides.scriptorium_stair={main:[row('lance','left','once'),row('spark','left')]};d.overrides.scriptorium_vault={prep:[row('ward','center')]};
 if(plan==='lean'){f.prep=[];e.prep=[];e.trained='shot';e.main=[row('shot','rear')];mage.main=[row('spark','rear')];mage.overrides.scriptorium_stair={main:[row('spark','left')]};}
 if(plan==='renew'){d.trained='unravel';d.prep=[row('bulwark','front'),row('ward','front','cycle')];d.main=[row('unravel','front','round'),row('spark','front')];d.overrides.scriptorium_stair={prep:[row('bulwark','center'),row('ward','center','cycle')]};d.overrides.scriptorium_vault={prep:[row('bulwark','center'),row('ward','center','cycle')]};}
 return c;
}

export function greenhouseConfig(plan='cleanse'){
 if(!['source','cleanse','corrode'].includes(plan))throw Error('未知蚀潮温室方案');const c=defaults();c.expedition='greenhouse';c.supplies={herb:12,rune:10,arrow:8};
 const get=id=>c.heroes.find(h=>h.id===id),a=get('a'),b=get('b'),m=get('c'),d=get('d'),e=get('e'),f=get('f');
 for(const h of c.heroes){h.item=['a','b'].includes(h.id)?'salve':'tonic';h.itemPolicy.threshold=h.item==='salve'?.5:.3;}
 a.main=[row('shieldbash','front','round'),row('strike')];b.main=[row('pierce','rear','round'),row('shot','rear')];m.main=[row('wave','front','once'),row('lance','rear','once'),row('spark','rear')];e.trained='mindcall';e.main=[row('mindcall','front','round'),row('shot','rear')];f.healing.threshold=.8;
 b.overrides.greenhouse_beds={main:[row('pierce','left','round'),row('shot','left')]};m.overrides.greenhouse_beds={main:[row('wave','front','once'),row('lance','left','once'),row('spark','left')]};d.overrides.greenhouse_beds={prep:[row('ward','center')]};d.overrides.greenhouse_root={prep:[row('ward','rear')]};
 if(plan==='cleanse'){d.prep=[row('cleanse','front')];d.overrides.greenhouse_beds={prep:[row('cleanse','center')]};d.overrides.greenhouse_root={prep:[row('cleanse','rear')]};}
 if(plan==='corrode'){f.trained='mireflask';f.main=[row('mireflask','rear','once'),row('shot','rear')];}
 return c;
}

export function clocktowerConfig(plan='rush'){
 if(!['rush','timed','steady'].includes(plan))throw Error('未知潮刻钟楼方案');const c=defaults();c.expedition='clocktower';c.supplies={herb:12,rune:10,arrow:8};const get=id=>c.heroes.find(h=>h.id===id),b=get('b'),m=get('c'),d=get('d'),e=get('e');for(const h of c.heroes)h.overrides={};
 b.main=[row('pierce','rear','round'),row('shot','rear')];m.main=[row('lance','rear','once'),row('spark','rear')];d.prep=[row('ward','front')];d.overrides.clocktower_gears={prep:[row('ward','center')]};d.overrides.clocktower_deck={prep:[row('ward','rear')]};e.prep=[row('insight','rear','once'),row('mastery','front')];
 b.overrides.clocktower_deck={main:[row('pierce','left','round'),row('shot','left')]};m.overrides.clocktower_deck={main:[row('lance','left','once'),row('spark','left')]};
 if(plan==='timed'){d.prep=[{...row('ward','front'),roundWindow:{from:2,to:4}}];m.main=[{...row('wave','front','once'),roundWindow:{from:3,to:4}},row('spark','rear')];d.overrides.clocktower_deck={prep:[{...row('ward','rear'),roundWindow:{from:2,to:4}}]};}
 if(plan==='steady'){b.main=[row('shot','rear')];m.main=[row('spark','rear')];b.overrides.clocktower_deck={main:[row('shot','left')]};m.overrides.clocktower_deck={main:[row('spark','left')]};}
 return c;
}
