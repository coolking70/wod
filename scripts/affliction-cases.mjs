// Explicit rule-boundary fixtures, never player growth or recommended builds.
import {defaults,row,naturalDefenses} from '../dist/expedition-data.mjs';import {buildParty} from '../dist/expedition-engine.mjs';
export function afflictionFixture(kind='attack'){
 const config=defaults();config.seed=7;config.supplies={herb:10,rune:10,arrow:10};for(const h of config.heroes){h.prep=[];h.main=[row('wait')];h.overrides={};h.item='none';h.healing.enabled=false;h.defenses=naturalDefenses();}
 config.heroes.find(h=>h.id==='e').main=[row('dissonance','front',kind==='double'?'repeat':'once'),row('wait')];
 const party=buildParty(config);for(const u of party){u.hp=u.maxHp=1000;u.mp=u.maxMp=200;u.attrs.agi=0;u.attrs.per=0;}
 const bard=party.find(u=>u.id==='e');bard.attrs.cha=100;bard.attrs.wil=100;bard.attrs.agi=100000;
 const enemy={id:'target',name:'规则用例守军',side:'enemy',pos:'front',gear:'field',attrs:{str:0,con:0,int:kind==='miss'?1000000:0,dex:0,cha:0,agi:0,per:0,wil:kind==='miss'?1000000:0,armor:kind==='absorbed'?10000:0},skills:{strike:8},hp:kind==='dead'?1:1000,maxHp:1000,mp:100,maxMp:100,prep:[],main:[row('strike','front')],defenses:naturalDefenses(),healing:{enabled:false}};
 if(kind==='double')bard.effects.push({id:'fixture-actions',skill:'rhythm',component:'用例额外行动',source:'e',stat:'actions',value:1,scope:'battle',active:true});
 if(['cleanse','empty-cleanse','source-dead'].includes(kind)){
  const a=config.heroes.find(h=>h.id==='a'),d=config.heroes.find(h=>h.id==='d'),e=config.heroes.find(h=>h.id==='e');e.main=[row('wait')];a.main=[row('strike','front')];
  enemy.skills={dissonance:20,wait:0};enemy.gear='lute';enemy.attrs.cha=100;enemy.attrs.wil=100;enemy.attrs.agi=100000;enemy.main=[row('dissonance','front','once'),row('wait')];
  if(kind!=='source-dead')d.prep=[row('cleanse','front'),row('ward','front','cycle')];
  if(kind==='empty-cleanse')enemy.main=[row('wait')];
  if(kind==='source-dead'){enemy.hp=1;config.heroes.find(h=>h.id==='c').main=[row('spark','front','once'),row('wait')];const unit=party.find(u=>u.id==='c');unit.attrs.int=1000;unit.attrs.wil=1000;unit.attrs.agi=1000;}
 }
 const enemies=[enemy];if(kind==='source-dead')enemies.push({...structuredClone(enemy),id:'witness',name:'规则用例见证者',pos:'rear',hp:1000,skills:{wait:0},main:[row('wait')],attrs:{...enemy.attrs,agi:0}});
 return {config,options:{party,rooms:[{id:'gallery',name:'削弱与净化规则用例',enemies}],maxRounds:['expiry','cleanse','empty-cleanse','source-dead'].includes(kind)?3:1}};
}
