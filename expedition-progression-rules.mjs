// Active values belong to this prototype, not to any verified WoD server.
// Research candidates live in docs; they cannot select or mutate runtime rules.
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export const PROGRESSION_RULES=freeze({
 id:'abbey-prototype-growth-1',source:'project-design',verification:'prototype',referenceServer:null,
 training:{maxRank:3,xpUnit:20},course:{costXp:40,requiredStage:2},
 stages:[{level:1,name:'初入',earned:0,advancedRank:1},{level:2,name:'熟练',earned:60,advancedRank:1},{level:3,name:'资深',earned:150,advancedRank:3}],
 advancement:{costXp:80,requiredXp:300,requiredClear:'veteran'}
});
export const rankCost=n=>n*(n+1)/2;
export const experienceForTraining=training=>Object.values(training).reduce((n,v)=>n+rankCost(v)*PROGRESSION_RULES.training.xpUnit,0);
export const COURSE_REQUIRED_XP=PROGRESSION_RULES.stages.find(s=>s.level===PROGRESSION_RULES.course.requiredStage).earned;
export const trainingCostText=Array.from({length:PROGRESSION_RULES.training.maxRank},(_,i)=>(i+1)*PROGRESSION_RULES.training.xpUnit).join('/');
export const trainingTotalText=Array.from({length:PROGRESSION_RULES.training.maxRank},(_,i)=>rankCost(i+1)*PROGRESSION_RULES.training.xpUnit).join('/');
