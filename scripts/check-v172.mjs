import './capture-bootstrap.cjs';
import fs from 'node:fs';import {resolve} from 'node:path';import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {careFocusLoop} from './care-focus-cases.mjs';
const out=resolve(process.env.WOD_EVIDENCE_DIR||'/tmp/wod-v172');fs.mkdirSync(out,{recursive:true});const save=(k,v)=>fs.writeFileSync(resolve(out,'focus-'+k+'.json'),JSON.stringify(v,null,2)),x=careFocusLoop();
for(const k of ['start','source','history120','loaded','desktop','final','finalSource','survivalSource','survival'])save(k,x[k]);for(const [i,r]of x.runs.entries())for(const k of ['preparation','pending','report','reward','claimed'])save((i+1)+'-'+k,r[k]);
for(const k of ['command','lineup','reportArchives','returnQuest','postQuest','foundryStory','harborStory','clocktowerStory'])assert.ok(isDeepStrictEqual(x.start[k],x.final[k]),k+' retained');
assert.deepEqual(x.runs.map(r=>r.pending.pending.id),[123]);assert.equal(x.start.gold,13205);
const normal=x.runs.map(r=>({id:r.pending.pending.id,route:r.report.config.expedition,seed:r.report.config.seed,won:r.report.won,alive:r.report.party.filter(u=>u.hp>0).length,rounds:r.report.rooms.map(r=>r.rounds),supplies:r.report.supplies,reward:r.reward}));
save('playcheck',{passed:true,normal,gold:x.final.gold,next:x.final.next,limits:'Same actual171plan, next123 predeclared with no tuning/training/seedsearch; care row keyboard retains actual event and focus. SVG study is isolated and does not replace production art; no generatedGIFclaim.'});console.log(JSON.stringify({passed:true,normal,gold:x.final.gold,next:x.final.next}));
