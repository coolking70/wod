// A finite solo story, based only on already claimed expedition outcomes.
// Reading it never writes rewards or progresses the guild.
export const FOUNDRY_STORY_GOLD=40;
export const FOUNDRY_STORY_ENDINGS={
 convoy:{name:'把归航的路留给后来人',gear:'bellowscoat',text:'赫宁把巡衣交给外港的护航队。修好的风箱不再催促守望者上工，而是在每艘返航船靠岸时响一声。名单上没有被涂掉的名字，只有下一班愿意接过灯的人。'},
 archive:{name:'把炉火的做法留在纸上',gear:'kilngauge',text:'你们把图纸摊在营地的长桌上。赫宁沿着尺规重新画出断开的水道，学徒在空白处写下失败过的办法。铸库终于有了可以传下去的记录，不必再靠一班不肯散去的守望者记住它。'},
 vigil:{name:'为最后一班守望点灯',gear:'watchseal',text:'徽记挂在旧炉门旁，灯下留着那一班人的名字。赫宁没有让谁承诺永远留在这里：守望的意义，是让后来的人可以平安离开。外港的船离岸时，门廊里第一次没有追来的脚步。'}
};
export const FOUNDRY_STORY_STEPS=[
 {id:'quiet',title:'让炉火停下',route:'foundry',condition:'领取一次锈潮铸库通关结算',before:'老匠赫宁听见外港又响起了炉锤声。“他们守着一座早该散班的工坊。先让炉火停下，再看看守望者到底留下了什么。”',after:'炉心安静下来，赫宁把耳朵贴在锈门上。“终于能听见海了。现在，让外港知道你们带回了什么。”'},
 {id:'proof',title:'带回一种回答',route:'foundry',condition:'正常完成“封存图纸”或“整队归航”任一目标',before:'带回完整图纸，或让同行的人完整归航。赫宁没有替你们决定哪一个更值得：“别只报一个胜字。告诉我，你们为什么还能回来。”',after:'外港收到了你们的回答。图纸与同伴的名字都能证明，这趟远征并非只为把守军打倒；已经完成的两项目标任意一项都计入旅程。'},
 {id:'watch',title:'替最后一班交接',route:'foundrywatch',condition:'领取一次封库守望通关结算',before:'换防门廊的灯仍亮着。解印师、医师与守望者各守一段旧命令，没人知道谁有权宣布散班。把他们的配合拆开，替最后一班完成交接。',after:'最后一班交出了钥印。赫宁在空白的交接簿上停了很久，终于把笔推向你们：“剩下的，由活着回来的人决定。”'}
];
export function validateFoundryStory(state){
 if(state===undefined)return;
 if(!state||typeof state!=='object'||Array.isArray(state)||Object.keys(state).length!==1||!Object.hasOwn(state,'ending')||typeof state.ending!=='string'||!Object.hasOwn(FOUNDRY_STORY_ENDINGS,state.ending))throw Error('铸库归航记录无效');
}
export function foundryStoryProgress(g){
 validateFoundryStory(g.foundryStory);
 const done={quiet:g.clears?.foundry>0,proof:(g.foundry?.claimed||[]).some(id=>['blueprints','home'].includes(id)),watch:g.clears?.foundrywatch>0};
 const steps=FOUNDRY_STORY_STEPS.map(step=>({...step,done:Boolean(done[step.id])})),ready=steps.every(s=>s.done),ending=g.foundryStory?.ending||null;
 return {steps,completed:steps.filter(s=>s.done).length,ready,ending,canClaim:ready&&!ending&&!g.pending,reason:ending?'归航结局已记录，不再发放旅程奖励。':g.pending?'请先领取当前远征结算，再完成归航交付。':!ready?'完成三段实际远征条件后，可以选择归航结局。':'可以选择一个结局，领取一次旅程奖励。'};
}
