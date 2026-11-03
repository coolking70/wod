import{writeFileSync}from'node:fs';
import{LOADOUTS,POLICIES,reserveConfig,reserveSummary}from'../dist/expedition-reserve.mjs';
import{simulate,RULESET}from'../dist/expedition-engine.mjs';
import{compactSample,SAMPLE_SEEDS}from'../dist/expedition-sampling.mjs';
const rows=[];
for(const loadout of Object.keys(LOADOUTS))for(const policy of Object.keys(POLICIES))for(const rescue of ['pass','aid']){
 const samples=SAMPLE_SEEDS.map(seed=>compactSample(simulate(reserveConfig(loadout,policy,rescue,seed))));
 const summary=reserveSummary(samples);rows.push({loadout,policy,rescue,summary,samples});console.log(loadout,policy,rescue,JSON.stringify(summary));
}
writeFileSync(new URL('../dist/samples-v16.json',import.meta.url),JSON.stringify({ruleset:RULESET,seeds:SAMPLE_SEEDS,rows},null,2)+'\n');
