import {defaults,clone,row} from '../dist/expedition-data.mjs';import {buildParty} from '../dist/expedition-engine.mjs';
// Controlled rule checks only. Inflated life/initiative are never player progression.
export function mentalFixture(){
 const config=defaults();for(const h of config.heroes){h.prep=[];h.main=[row('wait')];h.healing.enabled=false;h.item='none';h.training={};}
 config.heroes.find(h=>h.id==='e').main=[row('mindcall','front')];
 const party=buildParty(config);for(const u of party){u.hp=u.maxHp=1000;u.mp=u.maxMp=100;u.attrs.agi=0;}party.find(u=>u.id==='e').attrs.agi=1000;
 const target={id:'witness',name:'心理规则靶',mark:'靶',pos:'front',gear:'field',attrs:{str:8,con:10,int:10,dex:8,cha:10,agi:0,per:8,wil:10,armor:80},skills:{wait:0},hp:10000,maxHp:10000,mp:100,maxMp:100,defenses:{melee:'natural',ranged:'natural',magic:'natural'},prep:[],main:[row('wait')],healing:{enabled:false}};
 return {config,options:{party,rooms:[{id:'gallery',name:'心理攻击规则夹具',enemies:[clone(target)]}],maxRounds:1}};
}
