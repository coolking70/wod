const BOOKS=Object.freeze(['foundry','harbor','clocktower','postquest','returnquest']);
export function primaryJourneyProgress(c){
 if(c?.primary?.action!=='journey'||!BOOKS.includes(c.primary.value))return null;
 const j=c.journeys?.find(j=>j.id===c.primary.value);if(!j||j.ending)return null;
 const total=j.total??3;if(!Number.isSafeInteger(total)||total<1||!Number.isSafeInteger(j.completed)||j.completed<0||j.completed>total)return null;
 return {id:j.id,label:j.label,completed:j.completed,total,status:j.canClaim?'可选择一次结局':j.ready?'条件已齐，先领取当前远征':'尚有未完成的条件'};
}
export function focusJourneyHeading(root,book){
 if(!BOOKS.includes(book))return false;
 const h=root.querySelector(`[data-story-book="${book}"] > h2`);if(!h||h.closest('[hidden]'))return false;h.dataset.journeyHeading=book;
 return focusVisible(root,h);
}
function focusVisible(root,h){
 const tabs=root.querySelector('.guild-tabs'),view=root.ownerDocument.defaultView,sticky=tabs&&view.getComputedStyle(tabs).position==='sticky';
 h.tabIndex=-1;h.style.scrollMarginTop=((sticky?tabs.getBoundingClientRect().height:0)+14)+'px';h.focus({preventScroll:true});h.scrollIntoView({block:'start',behavior:'auto'});return true;
}
export function focusJourneyReceipt(root,book){
 if(!BOOKS.includes(book))return false;
 const h=root.querySelector(`[data-story-book="${book}"] [data-journey-receipt]`);if(!h||h.closest('[hidden]'))return false;return focusVisible(root,h);
}
