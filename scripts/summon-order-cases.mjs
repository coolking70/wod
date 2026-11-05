import {inquestConfig,hospiceConfig,scriptoriumConfig,defaults,row,naturalDefenses} from '../dist/expedition-data.mjs';import {applyBuild} from '../dist/expedition-builds.mjs';import {buildParty} from '../dist/expedition-engine.mjs';
export function summonOrderConfig(route='inquest',target='healer'){
 const make={inquest:()=>inquestConfig(),hospice:()=>hospiceConfig('source'),scriptorium:()=>scriptoriumConfig()};if(!make[route])throw Error('未知弩灵验证路线');const c=applyBuild(make[route](),'c','huntercaller');if(target==='rear')delete c.heroes.find(h=>h.id==='c').prep[0].summonTarget;else c.heroes.find(h=>h.id==='c').prep[0].summonTarget=target;return c;
}
// High life/initiative here fix rule boundaries, not normal player assets.
export function summonOrderFixture(target='healer'){
 const config=defaults();config.seed=7;config.supplies={herb:10,rune:10,arrow:10};for(const h of config.heroes){h.prep=[];h.main=[row('wait')];h.item='none';h.healing.enabled=false;h.defenses=naturalDefenses();}const c=config.heroes.find(h=>h.id==='c');c.prep=[{...row('tidearcher','rear'),summonTarget:target}];const party=buildParty(config);for(const u of party){u.hp=u.maxHp=2000;u.mp=u.maxMp=200;}
 const enemy=(id,pos,skills={shot:1})=>({id,name:id,side:'enemy',pos,gear:'field',attrs:{str:0,con:0,int:0,dex:0,agi:0,per:0,wil:0,cha:0},skills,hp:2000,maxHp:2000,mp:100,maxMp:100,defenses:naturalDefenses(),prep:[],main:[row('wait')],healing:{enabled:false}});
 return {config,options:{party,rooms:[{id:'gallery',name:'弩灵目标规则用例',enemies:[enemy('rear','rear'),enemy('healer','left',{heal:1}),enemy('caller','right',{tidearcher:1})]}],maxRounds:2}};
}
export const ownedAttacks=(report,owner='c')=>report.events.filter(e=>e.type==='attack'&&e.units.find(u=>u.id===e.actor)?.owner===owner);
