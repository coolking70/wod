export function mountReplayLayout({onChange}){
 const root=document.querySelector('#report'),q=s=>root.querySelector(s),panes={};
 const nav=document.createElement('nav');nav.className='replay-tabs';nav.setAttribute('aria-label','复盘工作区');
 nav.innerHTML='<button data-replay-pane="battle">战场回放</button><button data-replay-pane="evidence">行动证据</button><button data-replay-pane="review">远征复盘</button>';
 q('#result').after(nav);
 for(const key of ['battle','evidence','review']){const pane=document.createElement('div');pane.dataset.replayPaneContent=key;root.append(pane);panes[key]=pane;}
 const move=(key,selectors)=>selectors.forEach(s=>{const el=q(s);if(el)panes[key].append(el);});
 move('review',['.settlement-panel','#harbor-assessment','#chapter-ending','#contract-outcome','#survival-outcome','#chain-summary','.review-panel','.battle-grid>aside']);
 const journalBar=q('#diagnostic').closest('.bar');
 move('evidence',['#support-focus','#care-panel','#detail']);panes.evidence.append(journalBar);move('evidence',['#journal']);
 move('battle',['#harbor-journey','#rescue-result','#route-consequence','#event-scene','.replay-hint','.stage','#cue-strip','#unit-inspector']);
 const action=document.createElement('div');action.className='battle-action-bar';action.innerHTML='<span id="battle-action-summary"></span><button data-replay-pane="evidence">查看本次行动依据 →</button>';panes.battle.append(action);
 const controls=q('.replay-controls');nav.after(controls);controls.after(q('#route-strip'));q('#route-strip').after(q('#timeline'));
 const brief=document.createElement('p');brief.id='playback-brief';brief.className='muted';q('#timeline').after(brief);
 controls.insertAdjacentHTML('beforeend','<div class="playback-options"><label><input id="theatre-mode" type="checkbox">专注战场</label><label><input id="highlights-only" type="checkbox">关键行动播放</label><label><input id="focus-action" type="checkbox" checked>突出当前行动</label><label><input id="personal-playback" type="checkbox">只看观察角色相关行动</label><small>精选保留完整行动，省略部分普通攻击与状态；完整战报仍可查看。</small></div>');
 const next=q('#next-actions');brief.after(next);
 q('.battle-grid').remove();
 function open(key,scroll=false){if(!panes[key])return;if(key!=='battle'){document.body.classList.remove('replay-focus');q('#theatre-mode').checked=false;}onChange();for(const [id,el] of Object.entries(panes))el.hidden=id!==key;root.dataset.workspace=key;for(const b of nav.querySelectorAll('button')){b.classList.toggle('active',b.dataset.replayPane===key);b.setAttribute('aria-pressed',String(b.dataset.replayPane===key));}if(scroll)nav.scrollIntoView({block:'start'});}
 root.addEventListener('click',e=>{const b=e.target.closest('[data-replay-pane]');if(b)open(b.dataset.replayPane,true);},true);
 // Existing evidence and outcome shortcuts must reveal their target before scrolling.
 root.addEventListener('click',e=>{if(e.target.closest('[data-harbor-source],[data-evidence],[data-key-event],[data-ledger-event]'))open('battle');if(e.target.closest('[data-journey-evidence],[data-trace-origin],[data-trace-return]'))open('evidence');},true);
 open('battle');return {open};
}
