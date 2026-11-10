// Existing basic outcome conditions; choosing one changes no battle or reward parameters.
export const GOALS=[
 {id:'clear',name:'完成远征',rule:'肃清本路线全部房间。'},
 {id:'survive',name:'全员归航',rule:'完成远征，且六名队员全部存活。'},
 {id:'reserve',name:'留有余力',rule:'完成远征，且至少带回2符纸与2箭矢。'}
];
export function validateObjective(c){if(c&&Object.hasOwn(c,'objective')&&(typeof c.objective!=='string'||!GOALS.some(g=>g.id===c.objective)))throw Error('远征目标无效');}
export function withObjective(c,id){const n=structuredClone(c);if(id==='')delete n.objective;else n.objective=id;validateObjective(n);return n;}

export const goalsFor=c=>c.expedition==='returningtide'?GOALS.map(g=>g.id==='clear'?{...g,rule:'完成四房公开条件：泊口、机心与钟座清场；长堤可提前清场或至少一名队员撑过4个完整回合。'}:{...g}):c.expedition==='lockpass'?GOALS.map(g=>g.id==='clear'?{...g,rule:'完成两房公开条件：首房专业检定成功或清场，末房正常清场。'}:{...g}):c.expedition==='holdout'?GOALS.map(g=>g.id==='clear'?{...g,rule:'每房提前清场，或至少一名队员撑过公开的完整回合数；完成两房。'}:{...g}):GOALS;
