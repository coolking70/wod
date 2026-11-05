import {defaults,palisadeConfig,courierConfig,theaterConfig,row,naturalDefenses} from '../dist/expedition-data.mjs';
import {applyBuild} from '../dist/expedition-builds.mjs';
import {buildParty} from '../dist/expedition-engine.mjs';
export function unravelConfig(route='palisade',enabled=true){
 const c=({palisade:()=>palisadeConfig('bypass'),courier:()=>courierConfig('rhythm'),theater:()=>theaterConfig('plain')})[route]?.();if(!c)throw Error('未知破印验证路线');
 const next=applyBuild(c,'d','unraveler');if(!enabled)next.heroes.find(h=>h.id==='d').main=[row('spark','front')];return next;
}
// Rule-boundary fixtures are intentionally outside normal player progression.
export function unravelFixture(kind='ward'){
 const config=defaults();config.seed=7;config.supplies={herb:10,rune:10,arrow:10};for(const h of config.heroes){h.prep=[];h.main=[row('wait')];h.overrides={};h.item='none';h.healing.enabled=false;h.defenses=naturalDefenses();}
 const d=config.heroes.find(h=>h.id==='d');d.trained='unravel';d.main=[row('unravel','front',kind==='double'?'repeat':'round'),row('spark','front')];
 const party=buildParty(config);for(const u of party){u.hp=u.maxHp=2000;u.mp=u.maxMp=200;u.attrs.agi=0;u.attrs.per=0;}
 const scholar=party.find(u=>u.id==='d');scholar.attrs.int=100;scholar.attrs.wil=100;scholar.attrs.agi=100000;
 const enemy={id:'target',name:'破印规则守军',side:'enemy',pos:'front',gear:'focus',attrs:{str:0,con:0,int:0,dex:0,cha:0,agi:0,per:0,wil:0,armor:0},skills:{ward:8,bulwark:8,rhythm:8,guard:8,strike:8},hp:2000,maxHp:2000,mp:200,maxMp:200,prep:[row(kind==='pending'?'bulwark':kind==='queue'?'rhythm':'ward','front')],main:[row('strike','front')],defenses:naturalDefenses(),healing:{enabled:false}};
 if(kind==='empty')enemy.prep=[];
 if(kind==='miss'){enemy.attrs.int=enemy.attrs.wil=1000000;}
 if(kind==='absorbed')enemy.attrs.armor=10000;
 if(kind==='dead')enemy.hp=1;
 if(kind==='double')scholar.effects.push({id:'fixture-actions',skill:'rhythm',name:'用例额外行动',source:'e',stat:'actions',value:1,scope:'battle',active:true});
 if(kind==='enemy'){
  d.main=[row('wait')];d.prep=[row('ward','front')];enemy.prep=[];enemy.skills={unravel:20};enemy.main=[row('unravel','front','round')];enemy.attrs.int=enemy.attrs.wil=100;enemy.attrs.agi=1000000;
 }
 return {config,options:{party,rooms:[{id:'gallery',name:'破印规则用例',enemies:[enemy]}],maxRounds:['reapply','queue','pending'].includes(kind)?2:1}};
}
