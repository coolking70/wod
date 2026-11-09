import './capture-bootstrap.cjs';
import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {resolve} from 'node:path';
import {crossRouteProfiles} from './cross-route-cases.mjs';import {train,learnAdvanced} from '../dist/expedition-guild.mjs';import {setCompanion} from '../dist/expedition-command.mjs';
import {scarcityConfig,clone} from '../dist/expedition-data.mjs';import {rehearseReplacement} from '../dist/expedition-roster-rehearsal.mjs';
const g=setCompanion(learnAdvanced(train(crossRouteProfiles().recruited,'d','skill:ward'),'d'),'d','seer'),c=scarcityConfig(true),before=clone({g,c}),trial=rehearseReplacement(g,c,'b','mira');
assert.deepEqual({g,c},before);assert.equal(trial.summary.before.won,true);assert.equal(trial.summary.after.won,false);assert.equal(trial.summary.after.stopReason,'潮水封路');assert.equal(trial.summary.after.alive,6);assert.equal(trial.rooms.at(-1).after,null);
writeFileSync(resolve(process.env.WOD_TIMED_GUILD||(process.env.WOD_EVIDENCE_DIR+'/wod-v70-timed.json')),JSON.stringify(g,null,2));
writeFileSync('docs/V70_TIMED_CHECK.json',JSON.stringify({note:'A deterministic functional fixture, not an independent balance study. Guild earned through normal settlements/recruitment/training/course APIs. No input mutation, actual swap, departure or reward.',seed:trial.seed,summary:trial.summary,rooms:trial.rooms},null,2)+'\n');console.log('Normal timed fixture: current clears; candidate stops with all six alive; final room remains null.');
