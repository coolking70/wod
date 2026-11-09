// Transient camp navigation only: no guild, tactic or storage writes.
const cards=root=>[...root.querySelectorAll('[data-companion-card]')];
export function captureCompanionWorkbench(root){
 const active=root.ownerDocument.activeElement,card=active?.closest?.('[data-companion-card]');
 let focus=null;
 if(active?.id==='companion-room')focus={kind:'room'};
 else if(card&&root.contains(card)){
  for(const[kind,key]of[['picker','companion'],['apply','applyCompanion'],['cancel','cancelCompanion']])if(active.dataset?.[key]===card.dataset.companionCard)focus={kind,id:card.dataset.companionCard};
 }
 return{open:cards(root).filter(n=>n.querySelector('.companion-preview')?.open).map(n=>n.dataset.companionCard),focus};
}
export function restoreCompanionWorkbench(root,state){
 if(!state)return;const all=cards(root);
 for(const card of all){const detail=card.querySelector('.companion-preview');if(detail)detail.open=state.open.includes(card.dataset.companionCard);}
 const f=state.focus;if(!f)return;let target;
 if(f.kind==='room')target=root.querySelector('#companion-room');
 else{const card=all.find(n=>n.dataset.companionCard===f.id);if(!card)return;const selector={picker:'[data-companion]',apply:'[data-apply-companion]',cancel:'[data-cancel-companion]'}[f.kind];if(!selector)return;target=card.querySelector(selector);if(!target||target.disabled)target=card.querySelector('[data-companion]');}
 if(target&&!target.disabled&&!target.closest('[hidden]'))target.focus({preventScroll:true});
}
