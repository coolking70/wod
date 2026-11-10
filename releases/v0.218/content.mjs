export const VERSION='0.2.0';
export const POS={front:'前排',left:'左翼',right:'右翼',center:'中央',back:'后排'};
export const TYPES={melee:'近战',ranged:'远程',magic:'法术'};
export const ATTRS={dex:'灵巧',per:'感知',int:'学识',will:'意志'};
export const TRAIN={attack:'战技',defense:'防御',support:'辅助'};
export const GEAR={balanced:{name:'行军装',desc:'生命 +15，三类防御 +2',hp:15,def:{melee:2,ranged:2,magic:2}},plate:{name:'重甲盾',desc:'近防 +10，远防 +6，先攻 −6',speed:-6,def:{melee:10,ranged:6}},veil:{name:'符文披肩',desc:'法防 +12，法力 +12',mp:12,def:{magic:12}},lens:{name:'瞄准镜',desc:'命中 +9，三类防御 −3',hit:9,def:{melee:-3,ranged:-3,magic:-3}},kit:{name:'学者器具',desc:'辅助强度 +4，伤害 −4',support:4,damage:-4}};
export const SUPPLIES={herb:'药草',rune:'符纸',arrow:'特制箭',oil:'蚀甲油',tool:'工具'};
export const SKILLS={
 basic:{name:'基础攻击',phase:'main',kind:'attack',cost:0,power:1,desc:'按职业攻击类型与目标规则检定，不消耗法力。'},
 guard:{name:'守势',phase:'prep',kind:'buff',stat:'allDef',value:10,turns:1,cost:4,target:'self',desc:'本回合自身三类防御提高；不是吸收伤害的固定护盾。'},
 ward:{name:'偏转屏障',phase:'prep',kind:'buff',stat:'rangedDef',value:10,turns:2,cost:5,media:'rune',desc:'为目标位置最多 3 人提供远防，持续本回合及下一回合。'},
 seal:{name:'避蚀仪式',phase:'prep',kind:'buff',stat:'magicDef',value:10,turns:2,cost:5,media:'rune',desc:'为目标位置最多 3 人提供法防，抵御腐蚀与法术。'},
 aim:{name:'瞄准术',phase:'prep',kind:'buff',stat:'hit',value:9,turns:2,cost:4,target:'self',desc:'提高自身命中，持续本回合及下一回合。'},
 inspire:{name:'勇气颂',phase:'prep',kind:'buff',stat:'hit',value:9,turns:2,cost:5,desc:'提高目标位置最多 3 人的命中；同名效果不叠加。'},
 haste:{name:'行军节拍',phase:'prep',kind:'buff',stat:'haste',value:1,turns:1,cost:9,media:'herb',desc:'目标位置最多 3 人本回合主行动 +1；辅助修习至少 5 级。'},
 study:{name:'研读星图',phase:'prep',kind:'buff',stat:'support',value:5,turns:99,cost:5,target:'self',desc:'提高自身辅助效果，持续本房间。先研读再支援会更强。'},
 ration:{name:'分配药膳',phase:'prep',kind:'buff',stat:'allDef',value:4,turns:99,cost:4,media:'herb',desc:'目标位置最多 3 人三类防御提高，持续本房间。'},
 break:{name:'蚀甲打击',phase:'main',kind:'attack',power:1.1,cost:5,media:'oil',debuff:true,desc:'命中后降低目标三类防御 6 点，持续本房间。'},
 volley:{name:'散射',phase:'main',kind:'attack',power:.85,cost:6,media:'arrow',aoe:3,desc:'远程攻击指定敌方位置最多 3 人，每个目标独立检定。'},
 burst:{name:'潮汐爆发',phase:'main',kind:'attack',power:.9,cost:7,media:'rune',aoe:3,desc:'法术攻击指定敌方位置最多 3 人。'},
 heal:{name:'药草治疗',phase:'main',kind:'heal',cost:5,media:'herb',desc:'治疗指定位置生命比例最低的存活队友；没有伤者会跳过。'},
 renew:{name:'法力回流',phase:'main',kind:'mana',cost:3,media:'rune',desc:'为另一名法力不足的队友恢复法力；不能作用于自己。'},
 weaken:{name:'迷乱低语',phase:'main',kind:'weaken',cost:5,desc:'通过法术检定削减敌人命中 12 点；同一目标不重复施加。'},
 solve:{name:'解读封印',phase:'main',kind:'solve',cost:4,media:'tool',desc:'在封印房间使用，每次推进 2 点解读；辅助修习至少 4 级。'}
};
const roles={guardian:{role:'护卫',mark:'盾',type:'melee',hp:145,mp:35,attrs:{dex:8,per:6,int:4,will:6},skills:['guard','ward','break']},fighter:{role:'战士',mark:'刃',type:'melee',hp:120,mp:32,attrs:{dex:9,per:7,int:4,will:4},skills:['guard','aim','break']},ranger:{role:'射手',mark:'弓',type:'ranged',hp:95,mp:38,attrs:{dex:7,per:10,int:4,will:4},skills:['aim','ration','volley','break']},mage:{role:'术士',mark:'术',type:'magic',hp:85,mp:65,attrs:{dex:4,per:6,int:10,will:8},skills:['study','seal','burst','weaken']},scholar:{role:'学者',mark:'书',type:'ranged',hp:90,mp:55,attrs:{dex:5,per:7,int:10,will:6},skills:['study','ward','seal','renew','solve']},bard:{role:'诗人',mark:'歌',type:'magic',hp:95,mp:55,attrs:{dex:5,per:7,int:7,will:9},skills:['inspire','haste','weaken','renew']},herbalist:{role:'药师',mark:'药',type:'ranged',hp:95,mp:55,attrs:{dex:5,per:7,int:9,will:7},skills:['ration','ward','heal','renew']}};
export const HEROES=[['a','阿瑟','guardian','front'],['b','诺拉','guardian','back'],['c','薇拉','fighter','left'],['d','凯恩','fighter','left'],['e','莱恩','ranger','right'],['f','米娅','ranger','right'],['g','伊芙','mage','right'],['h','奥林','mage','center'],['i','维斯','scholar','back'],['j','塞恩','bard','left'],['k','露弥','herbalist','center'],['l','珂拉','bard','center']].map(([id,name,job,pos])=>({id,name,job,pos,...roles[job]}));
export const ROOMS=[
{id:'gallery',name:'弩手侧廊',subtitle:'弩箭绕过石柱，集中射向前排。',lesson:'对应防御 / 支援覆盖',intel:'三名弩手在敌方后排射击我方前排，卫兵阻挡近战。远程可指定后排；偏转屏障能降低弩箭命中。',enemies:[['壁垒卫兵','front','melee',155,34,24],['壁垒卫兵','front','melee',155,34,24],['伏击弩手','back','ranged',100,46,31],['伏击弩手','back','ranged',100,46,31],['伏击弩手','back','ranged',100,46,31]]},
{id:'corrosion',name:'腐蚀大厅',subtitle:'侵蚀并非一次伤害，而是整个队伍的消耗。',lesson:'法术防护 / 持续补给',intel:'每回合主阶段前，全队受到腐蚀检定（命中 39，伤害 10）。法防有效；守势、仪式或药膳可防护，也可通过快速清场缩短暴露。',hazard:true,enemies:[['蚀潮祭司','center','magic',130,41,23],['蚀潮祭司','center','magic',130,41,23],['溺水卫兵','front','melee',180,35,24]]},
{id:'wings',name:'分翼守卫',subtitle:'两翼守卫先接触对侧翼，再转向前排。',lesson:'攻击路线 / 分担压力',intel:'敌方左翼优先攻击我方右翼，敌方右翼优先攻击我方左翼。侧翼同样需要防御；所有人藏在中央会把压力集中到前排。',enemies:[['左翼刃卫','left','melee',150,43,29],['左翼刃卫','left','melee',150,43,29],['右翼刃卫','right','melee',150,43,29],['右翼刃卫','right','melee',150,43,29],['中央巫师','center','magic',110,40,23]]},
{id:'seal',name:'封印圣坛',subtitle:'敌人倒下之后，封印仍挡住归途。',lesson:'专业能力 / 替代解法',intel:'击败守卫且封印进度达到 6 才算通过。学者可耗工具解读；敌人清空后，普通攻击自动尝试强行破印，每累计 60 点强攻推进 1 点，反噬行动者 8 生命。',seal:true,enemies:[['守誓者','front','melee',280,43,31],['誓约残影','back','magic',150,43,25],['誓约残影','back','magic',150,43,25]]}
];
export const copy=x=>JSON.parse(JSON.stringify(x));
export const row=(skill,target='front',mode='standard')=>({skill,target,mode});
export function baseConfig(){return {version:VERSION,seed:731,supplies:{herb:8,rune:8,arrow:4,oil:2,tool:2},heroes:HEROES.map(h=>({id:h.id,pos:h.pos,attrs:{dex:h.type==='melee'?6:0,per:h.type==='ranged'?6:0,int:h.type==='magic'?6:0,will:0},training:{attack:4,defense:4,support:4},gear:'balanced',prep:[],main:[row('basic')],overrides:{}}))};}
export function preset(kind='defense'){
 const c=baseConfig();
 for(const h of HEROES){const b=c.heroes.find(x=>x.id===h.id);const supporting=['scholar','herbalist','bard'].includes(h.job);b.training=supporting?{attack:1,defense:4,support:7}:h.job==='guardian'?{attack:2,defense:8,support:2}:{attack:7,defense:4,support:1};b.attrs={dex:0,per:0,int:0,will:0};b.attrs[supporting?'int':h.type==='magic'?'will':h.type==='ranged'?'per':'dex']=6;b.gear=h.job==='guardian'?'plate':supporting?'kit':'balanced';
  if(h.job==='guardian')b.prep=[row('guard','self','repeat')];
  if(h.job==='fighter'){b.prep=[row('aim','self','repeat')];b.main=[row('break'),row('basic')];}
  if(h.job==='ranger'){b.prep=[row('aim','self','repeat')];b.main=[row('volley','back'),row('basic','back')];}
  if(h.job==='mage'){b.prep=[row('study','self','once')];b.main=[row('burst','center'),row('basic','center')];}
  if(h.job==='scholar'){b.prep=[row('study','self','once'),row('ward','front','repeat')];b.main=[row('renew','all'),row('basic','back')];b.overrides[1]={prep:[row('seal','center','repeat')]};b.overrides[3]={main:[row('solve','all','repeat'),row('renew','all'),row('basic','back')]};}
  if(h.job==='herbalist'){b.prep=[row('ration','front','once')];b.main=[row('heal','all','repeat'),row('basic')];}
  if(h.job==='bard'){b.prep=[row('inspire',h.id==='j'?'left':'right','repeat')];b.main=[row('weaken','front'),row('renew','all'),row('basic')];}
 }
 if(kind==='assault'){
  c.supplies={herb:5,rune:8,arrow:8,oil:1,tool:2};
  for(const h of HEROES){const b=c.heroes.find(x=>x.id===h.id);if(['fighter','ranger','mage'].includes(h.job)){b.gear='lens';b.training={attack:9,defense:2,support:1};}if(h.job==='bard')b.prep=[row('haste',h.id==='j'?'left':'right','repeat')];}
 }
 if(kind==='basic')return baseConfig();
 return c;
}
