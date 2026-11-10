// A finite, project-authored third chapter. Existing mechanics and costs apply.
// These encounters, story and numbers are not verified World of Dungeons rules.
const row=(skill,target='front',mode='repeat')=>({skill,target,mode});
const attrs={str:14,con:14,int:16,dex:14,cha:11,agi:11,per:13,wil:14};
const foe=(id,name,pos,hp,skills,main)=>({id,name,pos,side:'enemy',role:'归潮黎明',mark:'归',gear:'field',attrs:{...attrs},hp,maxHp:hp,mp:90,maxMp:90,skills,prep:[],main,defenses:{melee:'natural',ranged:'natural',magic:'natural'},healing:{enabled:false}});
export const RETURNING_TIDE_ROOMS=[
 {id:'dawn-quay',name:'01 · 失灯泊口',note:'归航船被旧守军拦在泊口。前排护卫援护后排医师与弩手，医师只照护前排。远程择敌仍受援护影响，法术或心理可以按原范围拆开支援；并非指定职业门槛。',enemies:[{...foe('dq-g','泊口护灯卫','front',200,{strike:8,interpose:8},[row('strike')]),gear:'guardblade',prep:[row('interpose','rear')]},foe('dq-a','失灯巡弩手','rear',125,{shot:8},[row('shot','rear')]),{...foe('dq-h','候潮医师','rear',120,{spark:7,heal:8},[row('spark','center')]),healing:{enabled:true,threshold:.65,target:'front',priority:'lowest'}}]},
 {id:'dawn-engine',name:'02 · 回潮机心',note:'船台升起前须关闭旧潮炉。护卫拖住前排，后排司炉者首次普通行动预付潮汐冲击费用，蓄能2回合后按当时中央目标释放。抢攻来源或留出防护窗口；倒下取消但不退原敌方费用，跨房不回满。',enemies:[foe('de-g','机心看守','front',180,{strike:8},[row('strike')]),{...foe('de-c','回潮司炉者','rear',240,{wave:10,spark:8},[row('spark','rear')]),windup:{skill:'wave',target:'center',rounds:2}}]},
 {id:'dawn-causeway',name:'03 · 等潮长堤',holdout:{rounds:4},note:'闸门已松，只须守到第4个完整回合接上浮桥，也可以提前清场。至少一名正式队员生还；尚存守军不计击倒。保护、削弱、救护与输出都消耗原行动，跨房生命、法力和物资照常延续。',enemies:[foe('dc-g','长堤系缆卫','front',190,{strike:8},[row('strike')]),foe('dc-a','雾岸弩手','rear',130,{shot:8},[row('shot','rear')]),foe('dc-m','退潮咏唱者','center',160,{wave:8,spark:7},[row('wave','center','once'),row('spark','center')])]},
 {id:'dawn-heart',name:'04 · 黎明钟座',note:'最后一枚旧印仍在守钟者身上。开始免疫法术/心理攻击；生命不高于50%且仍存活时，转为免疫近战/远程并用中央潮汐冲击。物理先破印、施法接手，或凭真实伤害直接击倒；不锁血、不回满、不多给行动。侍药只照护前排，仍可按原范围拆源。',enemies:[{...foe('dh-b','归潮守钟者','front',360,{strike:10,wave:10,spark:8},[row('strike')]),immuneTo:['magic','mental'],healthPhases:[{id:'daybreak',name:'旧印迎光',threshold:.5,immuneTo:['melee','ranged'],prep:[],main:[row('wave','center'),row('spark','rear')]}]},{...foe('dh-h','守钟侍药','rear',125,{spark:7,heal:8},[row('spark','center')]),healing:{enabled:true,threshold:.65,target:'front',priority:'lowest'}}]}
];
export function returningTideEnding(report){
 if(report?.config?.expedition!=='returningtide')return null;
 const alive=report.party.filter(u=>u.hp>0).length,cleared=report.rooms.filter(r=>r.won).length;
 return {title:report.won?'钟座迎来天光，归航不再等待潮声。':'天色将明，队伍先退回有灯的海岸。',image:'returning-tide-v220.svg',text:`通过 ${cleared}/4 场；${alive}/6 位同行者仍有战斗能力。${report.won?('旧印已经卸下，'+(alive<6?'倒下的伙伴随船回营':'六人一起随船回营')+'；归航是这一段故事的结束，自由探索仍可继续。'):'按已通过的房间领取实际收益，再用现有资产重新准备；本次不发通关额外奖励。'}剩余：${report.supplies.herb}药草 / ${report.supplies.rune}符纸 / ${report.supplies.arrow}箭矢。遗物、金币和经验须明确领取才入账。剧情与遭遇均为项目原创。`,won:report.won};
}
