export const UNIT_POOL_ENCODING='gzip-units-v1-base64';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,keys)=>object(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const bytes=s=>new TextEncoder().encode(s).length;
export function packUnitStates(report){
 const unitStates=[],indices=new Map();
 const events=report.events.map(event=>({...event,units:event.units.map(unit=>{const text=JSON.stringify(unit);let index=indices.get(text);if(index===undefined){index=unitStates.length;indices.set(text,index);unitStates.push(JSON.parse(text));}return index;})}));
 return{format:'wod-unit-states',version:1,unitStates,report:{...report,events}};
}
export function unpackUnitStates(value,expectedBytes,limit=expectedBytes){
 if(!Number.isSafeInteger(expectedBytes)||!Number.isSafeInteger(limit)||expectedBytes<1||expectedBytes>limit)throw Error('单位状态还原大小无效');
 if(!exact(value,['format','version','unitStates','report'])||value.format!=='wod-unit-states'||value.version!==1||!Array.isArray(value.unitStates)||value.unitStates.length>800000||!object(value.report)||!Array.isArray(value.report.events)||value.report.events.length<1||value.report.events.length>20000)throw Error('单位状态压缩格式无效');
 const stack=[[value,0]];while(stack.length){const [v,d]=stack.pop();if(object(v)||Array.isArray(v)){if(d>130)throw Error('单位状态压缩嵌套过深');for(const child of Object.values(v))stack.push([child,d+1]);}}
 const texts=value.unitStates.map(unit=>{if(!object(unit)||typeof unit.id!=='string'||!unit.id||unit.id.length>100||typeof unit.name!=='string'||!unit.name||unit.name.length>100)throw Error('单位状态字典无效');return JSON.stringify(unit);});
 if(new Set(texts).size!==texts.length)throw Error('单位状态字典含重复记录');
 const sizes=texts.map(bytes),used=new Set();let expandedBytes=bytes(JSON.stringify(value.report));
 for(const event of value.report.events){
  if(!object(event)||!Array.isArray(event.units)||event.units.length>40||new Set(event.units).size!==event.units.length)throw Error('单位状态引用无效');
  let arrayBytes=2+Math.max(0,event.units.length-1);
  for(const index of event.units){if(!Number.isSafeInteger(index)||index<0||index>=texts.length)throw Error('单位状态引用越界');used.add(index);arrayBytes+=sizes[index];}
  expandedBytes+=arrayBytes-bytes(JSON.stringify(event.units));
  if(expandedBytes>limit||expandedBytes>expectedBytes)throw Error('单位状态还原大小超过上限');
 }
 if(used.size!==texts.length)throw Error('单位状态字典含未引用记录');
 if(expandedBytes!==expectedBytes)throw Error('单位状态还原长度不匹配');
 // Enforce the expanded byte budget before creating repeated objects. Every frame
 // receives separate objects, matching JSON.parse of the complete original report.
 return{...value.report,events:value.report.events.map(event=>({...event,units:event.units.map(index=>JSON.parse(texts[index]))}))};
}
