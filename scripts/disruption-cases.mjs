// Controlled rule-boundary fixtures only; these values are not player progression or rewards.
import {defaults,row,defaultHero,naturalDefenses} from '../dist/expedition-data.mjs';
import {buildParty} from '../dist/expedition-engine.mjs';
export function disruptionFixture(kind='early'){
 const config=defaults();config.seed=7;config.supplies={herb:10,rune:10,arrow:10};
 if(kind==='double'){config.heroes=config.heroes.map(h=>h.id==='b'?defaultHero('mira'):h);config.prepOrder=config.prepOrder.map(id=>id==='b'?'mira':id);}
 for(const h of config.heroes){h.prep=[];h.main=[row('wait')];h.overrides={};h.item='none';h.healing.enabled=false;h.defenses=naturalDefenses();}
 for(const h of config.heroes.filter(h=>h.id==='d'||h.id==='mira'))h.main=[row('suppress',kind==='nonHealer'?'rear':'healer','once'),row('spark','healer'),row('wait')];
 const party=buildParty(config);
 for(const u of party){u.hp=u.maxHp=1000;u.mp=u.maxMp=200;u.attrs.agi=0;u.attrs.per=0;}
 for(const u of party.filter(u=>u.id==='d'||u.id==='mira')){u.attrs.int=100;u.attrs.wil=100;u.attrs.agi=kind==='late'?0:100000;}
 const enemy={id:'medic',name:'规则用例药师',side:'enemy',pos:'rear',gear:'field',attrs:{str:0,con:0,int:kind==='miss'?1000000:0,dex:0,cha:0,agi:kind==='late'?100000:0,per:0,wil:kind==='miss'?1000000:0,armor:kind==='absorbed'?10000:0},skills:kind==='nonHealer'?{wait:0}:{heal:20,wait:0},hp:kind==='dead'?1:500,maxHp:1000,mp:100,maxMp:100,prep:[],main:[row('wait')],defenses:naturalDefenses(),defenseFocus:'resist',healing:{enabled:kind!=='nonHealer',threshold:.8,target:'self',priority:'lowest'},effects:[]};
 if(kind==='enemy'||kind==='item'){
  const d=party.find(u=>u.id==='d');d.main=[row('wait')];config.heroes.find(h=>h.id==='d').main=[row('wait')];d.attrs.agi=0;
  const f=party.find(u=>u.id==='f');f.hp=500;f.healing={enabled:true,threshold:.8,target:'all',priority:'lowest'};f.main=[row('shot','rear')];const h=config.heroes.find(h=>h.id==='f');h.healing={...f.healing};h.main=[row('shot','rear')];
  enemy.skills={suppress:20,wait:0};enemy.main=[row('suppress','healer','once'),row('wait')];enemy.healing.enabled=false;enemy.gear={weapon:'staff',armor:'focus',accessory:'guildseal'};enemy.attrs.int=100;enemy.attrs.wil=100;enemy.attrs.agi=100000;
  if(kind==='item'){const h=config.heroes.find(h=>h.id==='f');h.item='tonic';f.item='tonic';f.mp=1;f.itemInstance={id:'f:tonic',kind:'tonic',remaining:2};}
 }
 return {config,options:{party,rooms:[{id:'gallery',name:'截疗规则用例',enemies:[enemy]}],maxRounds:kind==='expiry'?2:1}};
}
