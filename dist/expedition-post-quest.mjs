// Project-original finite solo quest. Selection and claimed success are separate;
// old clears, experiments and unfinished departures never retroactively advance it.
import {clone} from './expedition-data.mjs';
import {validate} from './expedition-engine.mjs';
import {validateCommand} from './expedition-command.mjs';
export const POST_QUEST_GOLD=40;
export const POST_QUEST_ENDINGS={
 harbor:{name:'把回信交给等船的人',gear:'postbell',text:'弥洛把回信放在码头长桌上，没有再按到港时刻排序。有人等的是一句平安，有人等的是一个名字；铜铃响起时，船上和岸上的人终于听见了同一声回答。'},
 witness:{name:'为没有写完的名字留白',gear:'calmribbon',text:'你们没有把失败过的邮路从簿册上撕掉。弥洛在最后一行留了一段空白，系上从旧问堂带回的缎带：回信不必假装从未失散，归来的人也不必为迟到低头。'},
 vigil:{name:'将下一趟交给新的守望者',gear:'watchseal',text:'守望徽记留在码头值班簿旁。弥洛没有要求你们永远护送这一趟，而是把已经走过的两段路画给下一班人：能把职责交出去，才算真的完成了交接。'}
};
export const POST_QUEST_STEPS=[
 {title:'先让岸边的路安静下来',before:'缮信员弥洛收起被潮水打湿的旧封套。先处理一段岸路：让错拍回廊恢复节奏，或拆掉潮闸机廊的机关。两处只需选一处，接取前的通关不代替这次出发。',after:'岸边已经有了一条可以重新出发的路。弥洛把第一枚路签压进信封，剩下的那条路留给另一班归客。',routes:[{route:'counterpoint',text:'错拍回廊：承受迟拍、净化或拆开来源。'},{route:'trapworks',text:'潮闸机廊：专门拆解机关，队友分工保护与清场。'}]},
 {title:'给渡海的人留出接应',before:'信船需要一处能靠岸的地方。去潮堤迎接后续来人，或穿过墓廊辨清雾壳与刻纹。选择决定这趟经过哪一处；未经过的分支不会自动算作完成。',after:'接应的灯已经亮起。你们把这一段实际走过的路写进封套，另一处仍留在自由探索的海图上。',routes:[{route:'breakwater',text:'潮堤接应：同房增援，资源与行动游标跨波延续。'},{route:'ossuary',text:'潮影墓廊：按公开攻击免疫安排不同职业分工。'}]},
 {title:'让回信抵达回邮台',before:'最后一程仍是沉船邮路。前两段不会削弱守军或赠送补给；核对当前装备、培养、伙伴职责和三场指令。失败可以领取已过房间收益并再准备，任务等待下一次真正通关。',after:'信封抵达回邮台。弥洛先点过同行者的名字，再把未走的支路折在封套背后：这一趟终于可以交给等信的人。',routes:[{route:'courier',text:'沉船邮路：拆开节拍、护印与救护，完整通过三场。'}]}
];
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const integer=n=>Number.isSafeInteger(n)&&n>=1;
export function validatePostQuest(q,next,pendingId=null){
 if(q===undefined)return;
 if(!exact(q,['version','startedAt','selected','steps','ending'])||q.version!==1||!integer(q.startedAt)||q.startedAt>next||!Array.isArray(q.steps)||q.steps.length>3)throw Error('归信任务记录无效');
 let previous=q.startedAt-1;for(const [index,r]of q.steps.entries()){
  if(!exact(r,['id','route','config','command'])||!integer(r.id)||r.id<=previous||r.id>=next||r.id===pendingId||!POST_QUEST_STEPS[index].routes.some(v=>v.route===r.route))throw Error('归信任务路签顺序或路线无效');
  validate(r.config);if(r.config.expedition!==r.route||JSON.stringify(r.config).length>100000)throw Error('归信任务方案无效');
  if(r.command!==null){if(!r.command||typeof r.command!=='object'||Array.isArray(r.command))throw Error('归信任务本人记录无效');validateCommand(r.command);if(!r.config.heroes.some(h=>h.id===r.command.heroId))throw Error('归信任务本人不在路签中');}previous=r.id;
 }
 if(q.selected!==null&&(!POST_QUEST_STEPS[q.steps.length]?.routes.some(v=>v.route===q.selected)))throw Error('请选择本段可用的归信通路');
 if(q.ending!==null&&(typeof q.ending!=='string'||!Object.hasOwn(POST_QUEST_ENDINGS,q.ending)||q.steps.length!==3))throw Error('归信任务结局缺少三段路签');
}
export function postQuestProgress(g){
 const q=g.postQuest;validatePostQuest(q,g.next,g.pending?.id);
 const completed=q?.steps.length||0,ready=completed===3,ending=q?.ending||null;
 return {started:Boolean(q),completed,ready,ending,selected:q?.selected||null,current:ready?null:POST_QUEST_STEPS[completed],canStart:!q&&!g.pending&&Boolean(g.command),canClaim:ready&&!ending&&!g.pending,reason:ending?'回信已经交付，不能重新接取或再次领取任务奖励。':g.pending?'先领取当前远征结算；只有正常通关领取后才会记录本段路签。':!q?'接取后选择通路，按顺序带回三段新的正常通关结算；旧成果不会自动计入。':ready?'三段回信路签齐全，可以选择一次交付。':q.selected?'已选择本段通路；可重新准备、失败后重试或先去其他路线培养，已完成路签保留。':'选择本段的一条通路；完成后该段选择保留，再选择下一段。'};
}
export function startPostQuestState(g){if(g.postQuest)throw Error('归信任务已经接取或交付，不能重新接取');if(!g.command)throw Error('先选择自己的英雄，再接取归信任务');return {version:1,startedAt:g.next,selected:null,steps:[],ending:null};}
export function choosePostQuestState(g,route){const q=g.postQuest;if(!q||q.ending||q.steps.length===3)throw Error('当前没有待选择的归信通路');if(typeof route!=='string'||!POST_QUEST_STEPS[q.steps.length].routes.some(r=>r.route===route))throw Error('请选择本段可用的归信通路');return {...clone(q),selected:route};}
export function recordPostQuest(g,report,id,command){const q=g.postQuest;if(!q||!g.pending||id!==g.pending.id||JSON.stringify(report.config)!==JSON.stringify(g.pending.config)||q.ending||!q.selected||!report.won||report.config.expedition!==q.selected||id<q.startedAt||id<=(q.steps.at(-1)?.id||0))return false;q.steps.push({id,route:q.selected,config:clone(report.config),command:clone(command||null)});q.selected=null;return true;}
