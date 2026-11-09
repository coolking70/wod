import './capture-bootstrap.cjs';
import {mkdirSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';
import {threatMapLoop} from './threat-map-cases.mjs';
import {enemyThreatMap} from '../dist/expedition-threat-map.mjs';
import {readiness} from '../dist/expedition-readiness.mjs';
const out=resolve(process.env.WOD_EVIDENCE_DIR||'/tmp/wod-v111');mkdirSync(out,{recursive:true});const x=threatMapLoop();
for(const key of ['initialGuild','draft','prepared','firstConfig','firstReport','desktop','secondConfig','secondReport','final'])writeFileSync(resolve(out,'threat-'+key+'.json'),JSON.stringify(x[key],null,2));
const normal=[x.firstReport,x.secondReport].map(r=>({route:r.config.expedition,seed:r.config.seed,won:r.won,alive:r.party.filter(u=>u.hp>0).length,supplies:r.supplies,rounds:r.rooms.map(q=>q.rounds)}));
writeFileSync('docs/V111_PLAYCHECK.json',JSON.stringify({design:'Read-only project mapping of public initial commands to configured allies; official home-page design direction, no original rule replication.',normal,gold:[x.desktop.gold,x.final.gold],before:x.before,after:x.after,secondMap:enemyThreatMap(readiness(x.desktop,x.secondConfig).config),actualCisternAttacks:x.firstReport.events.filter(e=>e.type==='attack'&&['c2','c3'].includes(e.actor)).map(e=>({id:e.id,round:e.round,actor:e.actor,targets:e.targets,actual:e.detail.actual})),limit:'Initial command scopes only. Not an estimate of damage, action count, future coverage or safety; normal seeds 1/2 were fixed, not selected by success.'},null,2));
