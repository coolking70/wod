import fs from 'node:fs';import {resolve} from 'node:path';import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';
import {damageReviewLoop} from './damage-review-cases.mjs';
const out=resolve(process.env.WOD_EVIDENCE_DIR||'/tmp/wod-v175');fs.mkdirSync(out,{recursive:true});const save=(k,v)=>fs.writeFileSync(resolve(out,'damage-'+k+'.json'),JSON.stringify(v,null,2)),x=damageReviewLoop();
for(const k of ['start','source','history124','loaded','desktop','final','finalSource','survivalSource','survival'])save(k,x[k]);for(const [i,r]of x.runs.entries())for(const k of ['preparation','pending','report','reward','claimed'])save((i+1)+'-'+k,r[k]);
for(const k of ['command','lineup','reportArchives','returnQuest','postQuest','foundryStory','harborStory','clocktowerStory'])assert.ok(isDeepStrictEqual(x.start[k],x.final[k]),k+' retained');
assert.deepEqual(x.runs.map(r=>r.pending.pending.id),[126]);assert.equal(x.start.gold,13325);
const normal=x.runs.map(r=>({id:r.pending.pending.id,route:r.report.config.expedition,seed:r.report.config.seed,won:r.report.won,alive:r.report.party.filter(u=>u.hp>0).length,rounds:r.report.rooms.map(r=>r.rounds),supplies:r.report.supplies,reward:r.reward}));
save('playcheck',{passed:true,normal,gold:x.final.gold,next:x.final.next,limits:'Same actual174plan, next126 predeclared without tuning/training/seedsearch; recordedHPattackreview presentation only, no combat orownership changes.'});console.log(JSON.stringify({passed:true,normal,gold:x.final.gold,next:x.final.next}));
