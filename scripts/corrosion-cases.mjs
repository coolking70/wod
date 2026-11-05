import {defaults,row,naturalDefenses,scriptoriumConfig,theaterConfig,inquestConfig} from '../dist/expedition-data.mjs';import {buildParty} from '../dist/expedition-engine.mjs';import {applyBuild} from '../dist/expedition-builds.mjs';
export function corrosionConfig(route='scriptorium',enabled=true){const make={scriptorium:scriptoriumConfig,theater:()=>theaterConfig('plain'),inquest:inquestConfig};if(!make[route])throw Error('未知潮蚀验证路线');const c=applyBuild(make[route](),'f','corroder');if(!enabled)c.heroes.find(h=>h.id==='f').main=[row('shot','front')];return c;}
export function corrosionFixture(kind='ticks'){
 const config=defaults();config.seed=7;config.supplies={herb:10,rune:10,arrow:10};for(const h of config.heroes){h.prep=[];h.main=[row('wait')];h.overrides={};h.item='none';h.healing.enabled=false;h.defenses=naturalDefenses();}config.heroes.find(h=>h.id==='f').main=[row('mireflask','front',kind==='repeat'?'repeat':'once'),row('wait')];const party=buildParty(config);for(const u of party){u.hp=u.maxHp=2000;u.mp=u.maxMp=200;u.attrs.agi=0;u.attrs.per=0;}const f=party.find(u=>u.id==='f');f.attrs.int=100;f.attrs.wil=100;f.attrs.agi=100000;
 const enemy={id:'target',name:'潮蚀规则守军',side:'enemy',pos:'front',gear:'field',attrs:{str:0,con:0,int:0,dex:0,cha:0,agi:0,per:0,wil:0,armor:10000},skills:{strike:8},hp:2000,maxHp:2000,mp:100,maxMp:100,prep:[],main:[row('strike','front')],defenses:naturalDefenses(),healing:{enabled:false}};
 if(kind==='miss')enemy.attrs.int=enemy.attrs.wil=1000000;if(kind==='dead'){enemy.hp=1;enemy.attrs.armor=0;}
 if(kind==='cleanse'){enemy.skills.cleanse=8;enemy.gear='focus';enemy.attrs.armor=10000;enemy.prep=[row('cleanse','front')];}
 if(kind==='source-dead'){f.hp=1;enemy.gear='lute';enemy.attrs.cha=10000;enemy.skills={mindcall:20};enemy.main=[row('mindcall','center')];for(const h of config.heroes)h.pos=h.id==='f'?'center':'rear';}
 return {config,options:{party,rooms:[{id:'gallery',name:'潮蚀规则用例',enemies:[enemy]}],maxRounds:4}};
}
