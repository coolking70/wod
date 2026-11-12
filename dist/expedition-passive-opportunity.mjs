import {roomsFor,SKILLS} from './expedition-data.mjs';
// Public enemy skill inventory, not a simulation or a prediction of future actions.
export function passiveDiseaseOpportunities(config){
 return roomsFor(config).flatMap(room=>{const sources=room.enemies.flatMap(enemy=>{const skills=Object.keys(enemy.skills||{}).filter(id=>SKILLS[id]?.kind==='attack'&&SKILLS[id].type==='disease').map(id=>SKILLS[id].name);return skills.length?[{enemyId:enemy.id,name:enemy.name,skills}]:[];});return sources.length?[{roomId:room.id,roomName:room.name,sources}]:[];});
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function passiveOpportunityView(rooms){return `<section data-passive-opportunity><p>${rooms.length?'本路线有'+rooms.length+'房的敌方公开技能含疾病：':'本路线敌方公开技能未见疾病；本次培养不会提高近战、远程、法术或心理防御。'}</p>${rooms.length?'<ul>'+rooms.map(room=>`<li>${esc(room.roomName)}：${room.sources.map(source=>esc(source.name)+'（'+source.skills.map(esc).join('、')+'）').join('；')}</li>`).join('')+'</ul>':''}<p>这里只核对公开技能，不保证敌人实际出手、选中本人或抵抗成功；先攻、目标、法力和倒下会改变实际机会。永久培养会保留到其他路线，不会因切换路线自动退款；仍可按原价退回。具体效果以战报为准。</p></section>`;}
