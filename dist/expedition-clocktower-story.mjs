// Original project story. Uses claimed clears and explicit goal proofs only.
export const CLOCKTOWER_STORY_GOLD=40;
export const CLOCKTOWER_STORY_ROUTES=['scriptorium','greenhouse','palisade'];
export const CLOCKTOWER_STORY_ENDINGS={
 harbor:{name:'将准点留给返航的人',gear:'clockpin',text:'记时员莉珂把怀表调慢了一息。灯塔不再命令每艘船同时抵岸，而是给迟归的人多留一段亮着的海。你们在表盖上刻下同行者的名字：准点可以等，归航的人不能少。'},
 archive:{name:'把误令写在镜背',gear:'counterlens',text:'你们没有把错过的命令从记录里删掉。莉珂将书库的薄页贴在晶镜背面，让后来的人同时看见护印的益处与被拆去时的空缺。钟声终于能够被解释，而不必永远被服从。'},
 shelter:{name:'为迟归者备一盏露灯',gear:'filterveil',text:'莉珂把滤露的薄纱罩在营地灯上，温室与哨垒的归客都能沿着不刺眼的光走来。你们留下的不是一张永远正确的时刻表，而是一处允许人停下、换气、再出发的岸。'}
};
export const CLOCKTOWER_STORY_STEPS=[
 {id:'bell',title:'听见失序的钟',route:'clocktower',condition:'领取一次潮刻钟楼通关结算',before:'灯塔收到一封比船早到一天的信。记时员莉珂请你们去潮刻钟楼：那里每一声钟都在催促不该同时行动的人。先读三场敌情，再把实际归航的消息带回。',after:'钟面上的裂痕没有消失，归航的名字却终于与船一起抵岸。莉珂取下报时簿：“把钟停住很容易。我想知道，怎样让它不再催错人。”',actions:[{route:'clocktower',goal:'clear',label:'准备钟楼通关目标'}]},
 {id:'witness',title:'带回另一种归航办法',route:'scriptorium',condition:'逆印书库、蚀潮温室、折潮哨垒任选一路，明确选择“全员归航”并正式领取达成',before:'去书库看护印如何失效，去温室看净化怎样占用一次行动，或去哨垒看谁替同行者接下一击。任选一处，让六人都回来；普通通关并不会被自动推算成这份攻略。',after:'你们带回的不是一张统一答案。拆开护印、及时净化、分工接招，都是曾让六人走回岸上的办法。莉珂把这份已领取的攻略夹进报时簿，保留了你们真正做过的选择。',actions:CLOCKTOWER_STORY_ROUTES.map(route=>({route,goal:'survive',label:{scriptorium:'选择书库全员归航',greenhouse:'选择温室全员归航',palisade:'选择哨垒全员归航'}[route]}))},
 {id:'reserve',title:'给下一声钟留一点余力',route:'clocktower',condition:'潮刻钟楼明确选择“留有余力”，通关且带回至少2符纸与2箭矢后正式领取',before:'回到钟楼时，不必让每个人追着同一声钟行动。调整逐房指令、时序和用料，再把留有余力的实际成果交给莉珂。节制示例是可改的起点，不保证任何队伍或种子都达标。',after:'最后一声钟落下时，包里还留着余量。你们不再让所有人追着同一声钟奔跑。莉珂合上报时簿：“剩下的，交给下一位走向海的人。”',actions:[{route:'clocktower',goal:'reserve',label:'准备钟楼留有余力目标'}]}
];
export function validateClocktowerStory(state){if(state===undefined)return;if(!state||typeof state!=='object'||Array.isArray(state)||Object.keys(state).length!==1||!Object.hasOwn(state,'ending')||typeof state.ending!=='string'||!Object.hasOwn(CLOCKTOWER_STORY_ENDINGS,state.ending))throw Error('潮刻余响记录无效');}
export function clocktowerStoryProgress(g){validateClocktowerStory(g.clocktowerStory);const witnesses=CLOCKTOWER_STORY_ROUTES.filter(route=>g.expeditionBook?.[route]?.survive),done={bell:g.clears?.clocktower>0,witness:witnesses.length>0,reserve:Boolean(g.expeditionBook?.clocktower?.reserve)},steps=CLOCKTOWER_STORY_STEPS.map(step=>({...structuredClone(step),done:Boolean(done[step.id])})),ready=steps.every(s=>s.done),ending=g.clocktowerStory?.ending||null;return {steps,ready,ending,witnesses,completed:steps.filter(s=>s.done).length,canClaim:ready&&!ending&&!g.pending,reason:ending?'余响结局已记录，不再发放旅程奖励。':g.pending?'请先领取当前远征结算，再交付余响手记。':!ready?'完成三段已领取的正常成果，再选择手记的去处。':'可以选择一个结局，领取一次旅程奖励。'};}
