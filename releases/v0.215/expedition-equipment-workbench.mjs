// UI-only landmarks. Selecting a recipient never assigns or equips anything.
const TARGETS=Object.freeze({overview:'#equipment-overview',catalog:'#equipment-catalog-heading',sets:'#equipment-sets-heading',warehouse:'#equipment-warehouse-heading'});
export function equipmentWorkbenchView(stock){
 return `<nav class="equipment-workbench" aria-label="装备整备定位"><button data-equipment-jump="overview">当前穿戴</button><button data-equipment-jump="catalog">挑选装备</button><button data-equipment-jump="sets">个人配装册</button><button data-equipment-jump="warehouse"><img src="assets/items/warehouse-v195.svg" width="20" height="20" alt="" aria-hidden="true">共享仓库 · ${stock}件</button></nav>`;
}
export function focusEquipmentNode(root,node){
 if(!node||node.closest('[hidden]'))return false;
 const tabs=root.querySelector('.guild-tabs'),view=root.ownerDocument.defaultView,sticky=tabs&&view.getComputedStyle(tabs).position==='sticky';
 node.style.scrollMarginTop=((sticky?tabs.getBoundingClientRect().height:0)+14)+'px';
 if(!node.matches('button,input,select,textarea,a[href]'))node.tabIndex=-1;
 node.focus({preventScroll:true});node.scrollIntoView({block:'start',behavior:'auto'});return true;
}
export function focusEquipmentTarget(root,target){
 return Object.hasOwn(TARGETS,target)&&focusEquipmentNode(root,root.querySelector(TARGETS[target]));
}
