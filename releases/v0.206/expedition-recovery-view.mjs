const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Navigation and explanation only. Recovery still uses the existing explicit import flow.
export function guildUnavailableView(failure='',context='camp'){
 const map=context==='map',heading=map?'map-guild-recovery-title':'guild-recovery-title';
 return `<section class="panel guild-recovery" aria-labelledby="${heading}"><img src="assets/archive-lantern-v202.svg" width="64" height="64" alt="" aria-hidden="true"><div><p class="eyebrow">营地档案 / 检查与恢复</p><h${map?'2':'1'} id="${heading}" tabindex="-1">公会存档暂不可用</h${map?'2':'1'}><p>原存档未覆盖。${map?'请回营导出原始内容，再选择有效的公会备份。':'请先导出原始内容留存，再选择已确认有效的公会备份。'}</p>${failure?`<details><summary>查看读取失败原因</summary><p class="recovery-reason">${esc(failure)}</p></details>`:''}${map?'<button class="primary" data-cycle-action="hero">回营检查</button>':'<div class="recovery-actions"><button data-guild="backup">导出原始存档</button><label>恢复有效公会备份 <input type="file" id="guild-import" accept="application/json,.json"></label></div><small>这里恢复公会备份；会替换当前公会，确认前请保留原始内容。整档文件请勿作为公会备份导入。</small>'}</div></section>`;
}
