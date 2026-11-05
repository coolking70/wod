export const MANA_TRANSFER={threshold:.5,cost:8,base:1,scale:.08};
export const MANA_TRANSFER_RULE='消耗一次普通行动及施放者法力；只给所选友方范围内法力不高于50%的其他存活正式单位，按法力比例最低、同值按队伍顺序选一名。排除自身和召唤物；无合格者免费后备。转入不超过本次实际支付，生命治疗/伤害/增益另计；转入后不回滚已经失败的施法或既定行动队列。';
export function manaRecipients(actor,units,target,{eligible=true}={}){
 return units.filter(u=>u.side===actor.side&&u.hp>0&&u.id!==actor.id&&!u.owner&&(target==='all'||u.pos===target)&&(!eligible||u.maxMp>0&&u.mp/u.maxMp<=MANA_TRANSFER.threshold&&u.mp<u.maxMp)).sort((a,b)=>a.mp/a.maxMp-b.mp/b.maxMp);
}
export function manaTransferAmount(mean,paidMana){return Math.min(paidMana,Math.max(1,Math.floor(MANA_TRANSFER.base+mean*MANA_TRANSFER.scale)));}
