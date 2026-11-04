// Fixed state for rule boundaries only; explicit HP/MP are not progression rewards.
import {defaults,defaultHero,row,naturalDefenses} from '../dist/expedition-data.mjs';
import {buildParty} from '../dist/expedition-engine.mjs';
export function slowcareFixture(kind='normal'){
 const config=defaults();config.seed=7;config.supplies={herb:10,rune:10,arrow:10};
 if(kind==='double'){config.heroes=config.heroes.map(h=>h.id==='b'?defaultHero('orin'):h);config.prepOrder=config.prepOrder.map(id=>id==='b'?'orin':id);}
 for(const h of config.heroes){h.prep=[];h.main=[row('wait')];h.healing.enabled=false;h.item='none';h.overrides={};h.defenses=naturalDefenses();}
 for(const h of config.heroes.filter(h=>['f','orin'].includes(h.id))){h.prep=[row('slowcare','center','once')];h.main=[row('shot','rear')];}
 const party=buildParty(config);for(const u of party){u.hp=u.maxHp=1000;u.mp=u.maxMp=100;}party.find(u=>u.id==='f').hp=500;party.find(u=>u.id==='c').hp=995;
 const enemy={id:'fixtureEnemy',name:'缓释规则用例',side:'enemy',pos:'rear',gear:'field',attrs:{str:0,con:0,int:0,dex:0,cha:0,agi:0,per:0,wil:0,armor:0},skills:{wait:0},hp:10000,maxHp:20000,mp:100,maxMp:100,prep:[],main:[row('wait')],defenses:naturalDefenses(),healing:{enabled:false},effects:[]};
 if(kind==='sourceDown'){enemy.skills={spark:100,wait:0};enemy.attrs.int=enemy.attrs.wil=10000;enemy.main=[row('spark','healer','once'),row('wait')];}
 if(kind==='enemy'){config.heroes.find(h=>h.id==='f').prep=[];enemy.skills.slowcare=6;enemy.prep=[row('slowcare','self','once')];}
 return {config,options:{party,rooms:[{id:'gallery',name:'缓释规则用例',enemies:[enemy]}],maxRounds:4}};
}
