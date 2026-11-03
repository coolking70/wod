// Reproducible exploration, not a claim of statistical significance or optimality.
import {writeFileSync} from 'node:fs';
import {archiveConfig} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
const seeds=[9,42,101,317,731,2026,8080,99173];
const samples=seeds.map(seed=>({seed,plans:[false,true].map(adapted=>{const c=archiveConfig(adapted);c.seed=seed;const r=simulate(c);return {adapted,won:r.won,survivors:r.party.filter(h=>h.hp>0).length,rooms:r.rooms,supplies:r.supplies};})}));
const result={ruleset:'original-wod-inspired-0.8.0',note:'8 fixed seeds, identical budgets, four room-command changes; not causal isolation or win-rate estimate.',samples};
writeFileSync(new URL('../docs/V8_SAMPLES.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
for(const {seed,plans:[a,b]} of samples)console.log([seed,a.rooms.at(-1).hp,b.rooms.at(-1).hp,a.rooms.at(-1).mp,b.rooms.at(-1).mp,a.supplies.rune,b.supplies.rune].join(' | '));
