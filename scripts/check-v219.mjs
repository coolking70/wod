import './capture-bootstrap.cjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {targetPickLoop} from './target-pick-cases.mjs';
import {TARGET_PICK_RULE} from '../dist/expedition-target-pick.mjs';
const out=process.env.WOD_EVIDENCE_DIR,x=targetPickLoop();
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2));
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
save('target-pick-base-config.json',x.baseConfig);save('target-pick-enabled-config.json',x.config);save('tutorial1-report.json',x.firstReport);save('target-pick-start-api-guild.json',x.start);save('target-pick-final-api-guild.json',x.final);
const summary=[];
for(const r of x.runs){
 const id=r.before.next,prefix='normal'+id,selection=r.report.events.filter(e=>e.detail.targetPicking),varied=selection.filter(e=>new Set(e.detail.targetPicking.candidates.map(t=>t.hp)).size>1);
 for(const e of selection){const d=e.detail.targetPicking;assert.equal(d.mode,'lowestHp');for(const t of d.candidates)assert.equal(e.units.find(u=>u.id===t.id).hp,t.hp);if(d.reason==='lowest_current_hp')assert.equal(d.selected[0].hp,Math.min(...d.candidates.map(t=>t.hp)));}
 save(prefix+'-report.json',r.report);save(prefix+'-matched-control-report.json',r.controlReport);save(prefix+'-pending-api-guild.json',r.pending);save(prefix+'-claimed-api-guild.json',r.claimed);
 summary.push({id,seed:r.report.config.seed,actual:{won:r.report.won,alive:r.report.party.filter(u=>u.hp>0).length,rounds:r.report.rooms.map(v=>v.rounds),supplies:r.report.supplies,reward:r.reward,selectionRecords:selection.length,unequalHPPools:varied.length,reportSHA256:digest(r.report)},control:{won:r.controlReport.won,alive:r.controlReport.party.filter(u=>u.hp>0).length,rounds:r.controlReport.rooms.map(v=>v.rounds),supplies:r.controlReport.supplies,reportSHA256:digest(r.controlReport)},oneActualClaim:true});
}
const result={passed:true,version:'0.219',rule:TARGET_PICK_RULE,source:'New guild → original tutorial1 → earned classic2/3; only actual low-HP arms claimed',seedSearch:false,firstReport:x.firstReport.won,finalNext:x.final.next,finalGold:x.final.gold,originalSkillAndEnemyNumbersUnchanged:true,noPermanentSupplyEconomy:true,summary,limits:x.limits};
save('target-pick-playcheck.json',result);console.log(JSON.stringify(result));
