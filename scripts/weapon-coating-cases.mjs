import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {clone,row} from '../dist/expedition-data.mjs';
import {validateGuild,train,depart,pendingReport,pendingReward,claim,guildConfig} from '../dist/expedition-guild.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
export function coatingStart(){return validateGuild(JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/v134-earned-final.json.gz',import.meta.url)))));}
export function coatingConfig(start,index=0){const c=clone(start.history.find(h=>h.id===54).config);c.seed=start.next+index;c.heroes.find(h=>h.id==='f').prep=[row('imbue','rear','once'),row('provisions','all')];return c;}
export function coatingLoop(){const start=coatingStart(),runs=[];let g=start;for(let i=0;i<2;i++){if(i)g=train(g,'f','skill:imbue');const before=g,config=coatingConfig(start,i),pending=depart(g,config),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({before,config,pending,report,reward,claimed:g});}const bare=clone(runs[0].config);bare.heroes.find(h=>h.id==='f').prep.shift();return{start,desktop:runs[0].claimed,trained:runs[1].before,final:g,runs,comparison:{coated:runs[0].report,bare:{...simulate(guildConfig(start,bare)),perspective:clone(start.command)}}};}
