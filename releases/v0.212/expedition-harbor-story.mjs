export const HARBOR_STORY_GOLD=40;
export const HARBOR_STORY_ENDINGS={
 light:{name:'让灯先照见海上的人',gear:'beaconrod',text:'阿芮把灯杖架在塔窗边，第一束光没有照向港口的牌匾，而是扫过了最远的航道。来信终于有了回信：不必知道归航者的名字，也可以先替他们点灯。'},
 bridge:{name:'把回家的栈桥修好',gear:'quaycoat',text:'哨衣留给每天巡过栈桥的人。阿芮拿着修桥名单挨家敲门，断掉的木板换上了新钉子。灯塔照见了港口，而一条不用担心失足的路，让疲惫的人真正走回家。'},
 chart:{name:'把航路交给下一艘船',gear:'tidecompass',text:'你们把潮渠、药仓与灯塔画在同一张图上，连走错过的岔路也没有抹去。阿芮把罗盘放在地图中央：“下一封信，可以由他们自己带来。”港口不再只记得一次胜利，而是记得怎样回来。'}
};
export const HARBOR_STORY_STEPS=[
 {id:'bell',title:'沉钟之下的回声',route:'chapter',condition:'领取一次“沉钟之下”章节通关结算',before:'营地收到一封盐风港来信。守塔人阿芮写道，海雾让港口听得见沉钟，却看不见归航的灯。先走完沉钟下的路，把第一章未完的回声留在岸上。章节连续六场，建议先熟悉短线并培养队伍。',after:'沉钟归于寂静，信纸上的盐痕仍没有干。阿芮在第二张纸上只添了一句话：“现在，能不能来看看我们的灯？”'},
 {id:'shore',title:'抵达无光灯塔',route:'harbor',condition:'领取一次盐风港通关结算，普通或风暴均可',before:'从盐风关卡出发，栈桥和潮渠会通往不同的压力。出发前决定路线和共享物资，让整队走过四场遭遇；到塔下后仍要正常领取结算。',after:'守塔人接过你们带来的灯火。阿芮没有先问打倒了多少守军，而是问港口终于可以把哪一段归航交给你们。'},
 {id:'answer',title:'给港口一封回信',route:'harbor',condition:'正常完成“六人归航”“熄灭潮锁”或“药箱归岸”任一委托',before:'完整带回同行的人、解开潮锁、或经由药仓带回救助的希望，任选一种回答即可。不要求风暴，也不要求把每一条分支都走完。',after:'同伴的名字、解开的潮锁或药仓里的物资，让来信有了具体的回答。已经完成的任一指定委托都计入；花掉海图兑换装备不会抹去这段成果。'}
];
export function validateHarborStory(state){if(state===undefined)return;if(!state||typeof state!=='object'||Array.isArray(state)||Object.keys(state).length!==1||!Object.hasOwn(state,'ending')||typeof state.ending!=='string'||!Object.hasOwn(HARBOR_STORY_ENDINGS,state.ending))throw Error('灯塔来信记录无效');}
export function harborStoryProgress(g){validateHarborStory(g.harborStory);const done={bell:g.clears?.chapter>0,shore:g.clears?.harbor>0,answer:(g.harbor?.claimed||[]).some(id=>['home','seal','salvage'].includes(id))},steps=HARBOR_STORY_STEPS.map(step=>({...step,done:Boolean(done[step.id])})),ready=steps.every(s=>s.done),ending=g.harborStory?.ending||null;return {steps,completed:steps.filter(s=>s.done).length,ready,ending,canClaim:ready&&!ending&&!g.pending,reason:ending?'来信结局已记录，不再发放旅程奖励。':g.pending?'请先领取当前远征结算，再完成来信交付。':!ready?'完成三段实际远征条件后，可以给港口一封回信。':'可以选择一个结局，领取一次旅程奖励。'};}
