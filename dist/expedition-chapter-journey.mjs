// Read-only project navigation over existing, explicitly claimed chapter clears.
// This is not a WoD unlock rule, difficulty ranking or additional reward track.
const CHAPTERS=Object.freeze([
 Object.freeze({id:'chapter',label:'第一章 · 沉钟之下',text:'连续六场，先检查跨房生命、法力与物资。'}),
 Object.freeze({id:'harbor',label:'第二章 · 盐风港的无光灯塔',text:'四场与公开通路，战前选择和抵达状态决定实际路线。'}),
 Object.freeze({id:'returningtide',label:'第三章 · 归潮黎明',text:'四场归航终章，串联援护、蓄能、坚守和生命阶段。'})
]);
export function chapterJourney(g){
 const chapters=CHAPTERS.map(c=>{const clears=g.clears?.[c.id]||0,last=g.history?.find(r=>r.route===c.id)||null;return {...c,clears,done:clears>0,pending:g.pending?.config?.expedition===c.id,last:last?{id:last.id,won:last.won}:null};});
 return {chapters,completed:chapters.filter(c=>c.done).length,total:chapters.length,blockedByPending:Boolean(g.pending),visible:Boolean(g.command?.heroId)};
}
export function chapterJourneyView(j){
 if(!j?.visible)return '';
 return `<details class="chapter-journey" data-chapter-journey data-completed="${j.completed}" ${j.completed===2&&!j.chapters[2].done?'open':''}><summary>三章主线 · 已领取通关 ${j.completed}/${j.total} 章</summary><p>主线通关只在正式远征领取后记录。各章都可自由准备，无须先补完前章；这里不评价当前队伍能否通关。</p><ol>${j.chapters.map(c=>`<li data-chapter-route="${c.id}" data-chapter-done="${c.done}"><h3>${c.label}</h3><p>${c.done?'已通关领取 '+c.clears+' 次':'尚未通关领取'}${c.pending?' · 本章远征待领取':c.last?' · 最近第'+c.last.id+'次'+(c.last.won?'通关已领取':'止步已领取'):''}</p><small>${c.text}</small><button type="button" data-cycle-action="chapter" data-cycle-value="${c.id}" ${j.blockedByPending?'disabled':''}>${c.done?'重访本章准备':'准备本章'} →</button></li>`).join('')}</ol>${j.blockedByPending?'<p>先领取当前远征，再选择本章准备；查看进度不会代领。</p>':''}${j.completed===j.total?'<p class="chapter-journey-complete">三章通关成果均已领取。归航已完成，支线、旅程结局与自由探索仍可继续。</p>':''}<small>章节、导航和上述遭遇为本项目内容；没有新增任务奖励或解锁门槛。</small></details>`;
}
