const targets=Object.freeze({overview:'#editor-navigation',main:'#editor-main-heading',prep:'#editor-prep-heading',defense:'#editor-defense-heading',healing:'#editor-healing-heading',items:'#editor-items-heading',build:'#editor-build-heading',training:'.training-panel'});
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function editorNavigationView({name,roomName='',healing=false}){
 const links=[['main','普通指令'],['prep','预备指令'],['defense','独立防御'],...(healing?[['healing','自动救护']]:[]),['items','道具策略'],['build','站位与装备草稿'],['training','实验培养']];
 return `<nav id="editor-navigation" class="editor-navigation" aria-label="战术编辑定位" tabindex="-1"><p><img src="assets/tactics-compass-v207.svg" width="24" height="24" alt="" aria-hidden="true"><strong>${escape(name)}</strong> · ${escape(roomName||'默认方案')}</p><div>${links.map(([key,label])=>`<button type="button" data-editor-jump="${key}">${label}</button>`).join('')}</div><p class="muted">指令改动会保存到当前准备；公会出征仍采用实际持有的装备与培养。</p><button type="button" data-editor-review>核对实际队伍 →</button></nav>`;
}
export function editorBackView(){return '<button type="button" class="editor-back" data-editor-jump="overview">返回战术定位 ↑</button>';}
export function jumpEditor(root,key){
 if(!Object.hasOwn(targets,key)||root.closest('[hidden]'))return false;
 const target=root.querySelector(targets[key]);if(!target)return false;
 const tabs=root.ownerDocument?.querySelector('.prep-tabs'),sticky=tabs&&root.ownerDocument.defaultView.getComputedStyle(tabs).position==='sticky';
 target.style.scrollMarginTop=(sticky?tabs.getBoundingClientRect().height+12:12)+'px';target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'auto'});return true;
}
export function captureEditorField(root){
 const n=root.ownerDocument.activeElement;
 if(!n||!root.contains(n)||!['SELECT','INPUT'].includes(n.tagName)||!n.dataset.field)return null;
 return {hero:root.dataset.editorHero,room:root.dataset.editorRoom,tag:n.tagName,field:n.dataset.field,phase:n.dataset.phase,row:n.dataset.row};
}
export function restoreEditorField(root,at){
 if(!at||at.hero!==root.dataset.editorHero||at.room!==root.dataset.editorRoom||root.closest('[hidden]'))return false;
 const n=[...root.querySelectorAll('select[data-field],input[data-field]')].find(n=>n.tagName===at.tag&&n.dataset.field===at.field&&n.dataset.phase===at.phase&&n.dataset.row===at.row);
 if(!n||n.disabled)return false;n.focus({preventScroll:true});return true;
}
