import {scriptoriumConfig} from '../dist/expedition-data.mjs';import {newGuild,depart,pendingReport,pendingReward,claim,assignLoot,train} from '../dist/expedition-guild.mjs';import {selectHero} from '../dist/expedition-command.mjs';
export const SCRIPTORIUM_PLANS=['source','lean','renew'];
export const enemyDispels=r=>r.events.filter(e=>e.type==='dispel'&&e.units.find(u=>u.id===e.actor)?.side==='enemy');
export function scriptoriumProgression(){const start=selectHero(newGuild(),'d'),pending=depart(start,scriptoriumConfig()),first=pendingReport(pending),reward=pendingReward(pending),claimed=claim(pending),equipped=assignLoot(claimed,'d','counterlens'),trained=train(equipped,'d','skill:unravel');return {start,pending,first,reward,claimed,equipped,trained};}
