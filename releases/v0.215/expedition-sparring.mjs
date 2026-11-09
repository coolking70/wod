import {defaults,clone,HEROES,naturalDefenses} from './expedition-data.mjs';
import {guildConfig,validateGuild} from './expedition-guild.mjs';
import {simulate,buildParty,validate} from './expedition-engine.mjs';
export const SPARRING_RULE='本地AI个人演武：只让自己的英雄以实际装备、培养、课程和进阶独自入场，召唤按原规则加入；使用准备页默认指令与当前种子/携行量，房间覆盖和队友不参与。预先自动结算，再回看实际事件，沿原24回合上限。没有正式出征、金币、经验、装备、攻略或排名，不写入公会/准备页；临时HP/MP/物资只在本次演武报告中变化。单人结果不能代替六人协作、职业强弱或远征通关判断。';
const row=(skill,target='front',mode='repeat')=>({skill,target,mode});
const rival=(id,name,hp,mp,attrs,gear,skills,main,prep=[],defenses=naturalDefenses())=>({id:'sparring:'+id,name,mark:'练',side:'enemy',role:'本地演武对手',hp,maxHp:hp,mp,maxMp:mp,pos:'front',attrs,gear,skills,main,prep,defenses,healing:{enabled:false}});
export const SPARRING_RIVALS={
 shield:{name:'操盾陪练',description:'重甲与守势，物理攻击需要面对护甲；无治疗技能，追击治疗者的指令会按原游标查后备。',unit:rival('shield','操盾陪练',145,60,{str:13,con:13,int:10,dex:13,cha:10,agi:10,per:12,wil:12},{weapon:'guardblade',armor:'plate',accessory:'token'},{strike:8,shieldbash:8,guard:8},[row('shieldbash','front','once'),row('strike')],[row('guard','self')],{melee:'parry',ranged:'dodge',magic:'resist'})},
 sigil:{name:'刻符陪练',description:'给自己屏障，再以首轮群攻和后续微光施压。一个目标也支付完整群攻费用；法术/心理共用原心智防御。',unit:rival('sigil','刻符陪练',125,95,{str:9,con:11,int:15,dex:9,cha:11,agi:11,per:13,wil:14},{weapon:'focus',armor:'cloth',accessory:'token'},{spark:8,wave:8,ward:8},[row('wave','front','once'),row('spark')],[row('ward','self')],{melee:'natural',ranged:'natural',magic:'resist'})},
 bow:{name:'巡弓陪练',description:'一次重箭后持续单体射击，护甲、远程防御与出手时机仍按实际规则。无队友帮忙分担。',unit:rival('bow','巡弓陪练',130,65,{str:10,con:12,int:10,dex:15,cha:9,agi:13,per:14,wil:10},{weapon:'bow',armor:'cloth',accessory:'token'},{pierce:8,shot:8},[row('pierce','front','once'),row('shot')],[],{melee:'natural',ranged:'dodge',magic:'natural'})}
};
export const sparringSignature=(g,tactics,rivalId)=>JSON.stringify([g,tactics,rivalId]);
export function sparringSetup(g,tactics,rivalId){
 validateGuild(g);if(!g.command)throw Error('请先选择自己的英雄');if(typeof rivalId!=='string'||!Object.hasOwn(SPARRING_RIVALS,rivalId))throw Error('请选择已公布的本地演武对手');
 const actual=guildConfig(g,tactics),config=defaults();config.seed=actual.seed;config.supplies=clone(actual.supplies);config.heroes=actual.heroes.map(h=>({...clone(h),overrides:{}}));config.prepOrder=clone(actual.prepOrder);config.roomOrders={};validate(config);
 const heroId=g.command.heroId,hero=buildParty(config).find(h=>h.id===heroId),definition=HEROES.find(h=>h.id===heroId),opponent=clone(SPARRING_RIVALS[rivalId]);if(!hero)throw Error('自己的英雄当前不在出战队伍');
 return {heroId,heroName:definition.name,heroRole:definition.role,sourceRoute:actual.expedition,seed:config.seed,config,hero,opponent,rivalId,rule:SPARRING_RULE};
}
export function personalSparring(g,tactics,rivalId){
 validateGuild(g);if(g.pending)throw Error('请先领取正式远征结算，再进行个人演武');const setup=sparringSetup(g,tactics,rivalId),room={id:'personal-sparring',name:'个人演武 · '+setup.opponent.name,note:SPARRING_RULE,enemies:[setup.opponent.unit]},report=simulate(setup.config,{party:[setup.hero],rooms:[room]}),last=report.events.at(-1),hero=report.party[0],opponent=last.units.find(u=>u.id===setup.opponent.unit.id),casts=report.events.filter(e=>e.type==='cast'&&e.actor===setup.heroId);
 return {kind:'personal-sparring',version:1,heroId:setup.heroId,heroName:setup.heroName,heroRole:setup.heroRole,sourceRoute:setup.sourceRoute,rivalId,opponent:setup.opponent,seed:setup.seed,heroPlan:clone(setup.config.heroes.find(h=>h.id===setup.heroId)),initialHero:clone(setup.hero),report,summary:{outcome:report.won?'victory':hero.hp<=0?'defeat':'timeout',rounds:report.rooms[0].rounds,heroHp:hero.hp,heroMp:hero.mp,opponentHp:opponent.hp,opponentMp:opponent.mp,supplies:clone(report.supplies),casts:casts.length,skills:Object.fromEntries([...new Set(casts.map(e=>e.detail.skill))].map(skill=>[skill,casts.filter(e=>e.detail.skill===skill).length])),noRoleChecks:report.events.filter(e=>e.type==='skip'&&e.actor===setup.heroId&&e.detail.reason.startsWith('没有存活的')).length,failed:report.stats[setup.heroId].failed,damage:report.stats[setup.heroId].actual},signature:sparringSignature(g,tactics,rivalId),rule:SPARRING_RULE};
}
export function sparringFrame(value,index){if(value?.kind!=='personal-sparring'||!Array.isArray(value.report?.events)||!Number.isInteger(index)||index<0||index>=value.report.events.length)throw Error('演武回放位置无效');return clone(value.report.events[index]);}
export function exportSparring(value){if(value?.kind!=='personal-sparring'||value.version!==1)throw Error('没有可导出的个人演武');const {signature,...snapshot}=value;return {format:'wod-personal-sparring',version:1,snapshot:clone(snapshot),note:'仅为本地AI个人演武快照，不是正式远征、奖励收据或可导入准备配置。'};}
