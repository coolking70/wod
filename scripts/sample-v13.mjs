import {writeFileSync} from 'node:fs';
import {simulate,RULESET} from '../dist/expedition-engine.mjs';
import {SAMPLE_SEEDS,sampleConfig,compactSample,summarizeSamples} from '../dist/expedition-sampling.mjs';
const rows=[];
for(const profile of ['balanced','medic'])for(const rescue of ['pass','gather','aid'])for(const bell of ['bypass','study','force']){
 const samples=SAMPLE_SEEDS.map(seed=>compactSample(simulate(sampleConfig(profile,rescue,bell,seed))));
 rows.push({profile,rescue,bell,summary:summarizeSamples(samples),samples});
}
const output={ruleset:RULESET,seeds:SAMPLE_SEEDS,note:'固定种子1–32；封库默认战术。药师专精同时调整药师训练与专修；非当前编辑配置，不代表总体胜率或最优解。',rows};
writeFileSync(new URL('../dist/samples-v13.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(rows.map(({samples,...r})=>r),null,2));
