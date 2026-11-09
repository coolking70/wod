// Original two-room dungeon; all links and statistics are disclosed before departure.
const row=(skill,target='front',mode='repeat')=>({skill,target,mode});
const attrs={str:12,con:12,int:13,dex:12,cha:10,agi:10,per:12,wil:12};
const unit=(id,name,pos,skill,hp,level=7)=>({id,name,pos,side:'enemy',role:'潮锁护库',mark:'锁',gear:'field',attrs:{...attrs},skills:{[skill]:level},hp,maxHp:hp,mp:80,maxMp:80,prep:[],main:[row(skill)],defenses:{melee:'natural',ranged:'natural',magic:'natural'},healing:{enabled:false}});
const source=(id,name,pos,skill,target,links)=>({...unit(id,name,pos,skill,60),mark:'机',mechanism:true,gear:'starterblade',attrs:{...attrs,str:8,con:8,agi:6,per:10},mp:35,maxMp:35,main:[row(skill,target)],wardLinks:links});
const medic=(id,name)=>({...unit(id,name,'rear','spark',110),gear:'focus',skills:{spark:7,heal:8},healing:{enabled:true,threshold:.8,target:'front',priority:'lowest'}});
export const LOCKWORKS_ROOMS=[
 {id:'lockworks_single',name:'01 · 单锁栈庭',note:'左翼单锁机60耐久，为前排护库卫另加12护甲，自己持续齐射后排。拆机立刻切断本来源护壁，或先由心理输出绕过护甲、其他人拆医师；全清仍必须拆机。心理不绕攻击免疫，法术与附加法术段仍按原护甲规则。',enemies:[source('lws','单锁供能机','left','volley','rear',[{target:'lwg',armor:12}]),{...unit('lwg','护库卫','front','strike',145,8),gear:'guardblade'},medic('lwm','栈庭药师')]},
 {id:'lockworks_double',name:'02 · 双锁库台',note:'左右供能机各60耐久，各为前排双锁卫加8护甲，两份叠加。先拆一机只少8；普通技能护甲和另一机不被连带解除。药师救前排、后排弩手施压；读来源而不是把一次拆解等同清场。',enemies:[source('lwl','左锁供能机','left','spark','center',[{target:'lwd',armor:8}]),source('lwr','右锁供能机','right','shot','rear',[{target:'lwd',armor:8}]),{...unit('lwd','双锁卫','front','strike',190,8),gear:'guardblade'},medic('lwh','库台药师'),{...unit('lwa','库台弩手','rear','shot',100),gear:'bow',main:[row('shot','rear')]}]}
];
