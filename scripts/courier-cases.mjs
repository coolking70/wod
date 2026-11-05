import {newGuild,claimHarborStory,assignLoot,equip} from '../dist/expedition-guild.mjs';import {selectHero} from '../dist/expedition-command.mjs';import {lighthouseCases} from './lighthouse-cases.mjs';
export function courierPreparation(){const ready=lighthouseCases().ready,beforeProtection=assignLoot(claimHarborStory(ready,'chart'),'b','tidecompass'),afterProtection=equip(equip(beforeProtection,'e','saltseal'),'e','plate');return {beforeProtection,afterProtection};}
export function courierProfiles(){return {fresh:selectHero(newGuild(),'c'),grown:courierPreparation().afterProtection};}
