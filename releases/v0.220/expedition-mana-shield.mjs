// Project-original fixed encounter trait; not a claim about current WoD rules.
export const MANA_SHIELD_RULE='法力护盾是公开敌方固有特性，不是可破印的增益。直接生命攻击先完成攻击/防御、护甲和各段抗性，再用当时剩余法力吸收伤害：每1法力最多吸收2点，一次受击合并各段只支付一次，消耗向上取整。剩余伤害才扣生命并计算溢出；不占行动，不保证存活。防御先付法力，普通施法和自然回蓝仍共用此法力。断流只削蓝，潮蚀持续伤害绕过护盾；闪避/免疫/零伤不扣盾蓝，破印不能移除此特性。';
export function validateManaShield(u){
 if(!Object.hasOwn(u,'manaShield'))return;
 if(u.manaShield!==true||u.mechanism||u.owner||u.escort||!Number.isSafeInteger(u.maxMp)||u.maxMp<=0||!Number.isSafeInteger(u.mp)||u.mp<0||u.mp>u.maxMp)throw Error('法力护盾仅允许有合法法力的公开普通敌方模板');
}
// Pure projection; the engine applies returned MP and HP exactly once.
export function shieldHit(hit,u){
 if(!u.manaShield)return null;
 const parts=hit.damageParts?.map(p=>({...p}))||[{damage:hit.damage}],before=parts.reduce((n,p)=>n+p.damage,0),absorbed=Math.min(before,u.mp*2),paid=Math.ceil(absorbed/2);let shield=absorbed,hp=u.hp;
 for(const p of parts){const used=Math.min(shield,p.damage);shield-=used;p.damageBeforeShield=p.damage;p.shieldAbsorbed=used;p.damage-=used;p.actual=Math.min(hp,p.damage);p.overkill=p.damage-p.actual;hp-=p.actual;}
 return {damage:before-absorbed,actual:u.hp-hp,hpAfter:hp,mpAfter:u.mp-paid,...(hit.damageParts?{damageParts:parts,primaryDamage:parts[0].damage}:{}),manaShield:{damageBeforeShield:before,absorbed,paid,mpBefore:u.mp,mpAfter:u.mp-paid,hpPerMana:2,rule:MANA_SHIELD_RULE}};
}
const row=(skill,target='front',mode='repeat')=>({skill,target,mode});
const foe=(id,name,pos,hp,mp,skill)=>({id,name,pos,gear:'field',mark:'盾',attrs:{str:13,con:13,int:14,dex:13,cha:10,agi:10,per:12,wil:13},hp,maxHp:hp,mp,maxMp:mp,skills:{[skill]:8},prep:[],main:[row(skill,skill==='shot'?'rear':'front')],healing:{enabled:false},defenses:{melee:'natural',ranged:'natural',magic:'resist'}});
export const MANASHIELD_ROOMS=[
 {id:'manashield_gate',name:'01 · 蓄潮盾门',note:'前排盾门卫160生命/30法力，固有法力护盾每1法力吸收2点直接伤害。先付心智抵抗，再吸收；断流压蓝不扣生命，普通火力也能耗盾，潮蚀后续跳伤绕过。后排弩兵不带护盾，选择先拆后排或集中破盾各占行动。',enemies:[{...foe('msg','蓄潮盾门卫','front',160,30,'strike'),manaShield:true},foe('msa','盾门弩兵','rear',115,40,'shot')]},
 {id:'manashield_hall',name:'02 · 共流藏室',note:'后排藏室术士210生命/42法力，护盾、法术防御与微光共用法力；前排护卫无盾。断流、持续潮蚀和直接集中输出都能处理，后续自然回蓝可能恢复少量吸收，不能把一次断流当永久关盾。护盾不可破印；没有额外装备、压蓝奖励或强制职业钥匙。',enemies:[foe('msh','藏室护卫','front',150,40,'strike'),{...foe('msc','共流术士','rear',210,42,'spark'),gear:'focus',manaShield:true,main:[row('spark','center')]}]}
];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function manaShieldPreparationView(rooms){const list=rooms.flatMap(r=>[...r.enemies,...(r.reinforcements||[]).flatMap(w=>w.enemies)].filter(u=>u.manaShield).map(u=>({r,u})));return list.length?'<section class="mana-shield-preparation"><h3>法力护盾 · 公开生命与法力取舍</h3>'+list.map(({r,u})=>`<p>${esc(r.name)}：${esc(u.name)}，${u.maxHp}生命/${u.mp}法力；初始直接伤害吸收容量最多${u.mp*2}，实际还受防御/施法/压蓝与回蓝影响。</p>`).join('')+'<small>'+MANA_SHIELD_RULE+'</small></section>':'';}
export function manaShieldEvidenceView(group){const rows=(group?.events||[]).filter(e=>e.detail.manaShield);return rows.length?'<section class="mana-shield-proof"><h3>法力护盾 · 实际伤害与支付</h3>'+rows.map(e=>{const d=e.detail,s=d.manaShield;return `<article data-shield-event="${e.id}"><b>${esc(e.text)}</b><p>护甲/抗性后${s.damageBeforeShield} − 护盾吸收${s.absorbed} = 生命结算${d.damage}；实际扣生命${d.actual}，溢出${d.overkill}。盾蓝${s.mpBefore}→${s.mpAfter}，实际支付${s.paid}；不是攻击者断流实绩，也不重复计入生命实伤。</p></article>`;}).join('')+'<small>'+MANA_SHIELD_RULE+'</small></section>':'';}
