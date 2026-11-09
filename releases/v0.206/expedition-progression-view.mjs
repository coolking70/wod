import {experienceLedger} from './expedition-growth.mjs';
export function experienceView(member){
 const l=experienceLedger(member);
 return `<section class="experience-ledger"><h3>经验去向</h3><dl><div><dt>可用经验</dt><dd data-xp="available">${l.available}</dd></div><div><dt>永久训练投入 · 可退回</dt><dd data-xp="training">${l.training}</dd></div><div><dt>课程学习 · 重修时保留</dt><dd data-xp="courses">${l.courses}</dd></div><div><dt>后期进阶投入 · 可退回</dt><dd data-xp="advancement">${l.advancement}</dd></div><div><dt>累计经验</dt><dd data-xp="earned">${l.earned}</dd></div></dl><p>累计经验 = 可用 + 训练 + 课程 + 后期进阶。退回训练或进阶只移动经验去向，成长阶段不下降；课程不会被遗忘。装备和临时效果不计入培养投入。</p></section>`;
}
