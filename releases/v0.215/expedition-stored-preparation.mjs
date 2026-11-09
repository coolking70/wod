import {defaults,migrateConfig} from './expedition-data.mjs';
import {validate} from './expedition-engine.mjs';
import {PREPARATION_KEY} from './expedition-draft-storage.mjs';
export const COMPARISON_KEY=PREPARATION_KEY+'-a';
const failure=(raw,kind,error)=>({raw,value:null,error:{kind,message:String(error.message||error).slice(0,200)}});
function decode(raw,optional){
 if(raw===null)return {raw,value:optional?null:defaults(),error:null};
 try{
  const parsed=JSON.parse(raw);
  if(optional&&parsed===null)return {raw,value:null,error:null};
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('配置必须是对象');
  const value=migrateConfig(parsed);validate(value);return {raw,value,error:null};
 }catch(error){return failure(raw,'format',error);}
}
function read(storage,key,optional){let raw;try{raw=storage.getItem(key);}catch(error){return failure(null,'storage',error);}return decode(raw,optional);}
// Independent reads: an optional comparison cannot invalidate or replace preparation.
// No read path writes, deletes or migrates the stored raw strings in place.
export const readComparisonA=storage=>read(storage,COMPARISON_KEY,true);
export function readStoredPreparation(storage){return {preparation:read(storage,PREPARATION_KEY,false),comparison:readComparisonA(storage)};}
export function configurationRecoveryExport(record,kind){
 if(!['preparation','comparison-a'].includes(kind)||typeof record?.raw!=='string')throw Error('原始内容暂不可导出。');
 // JSON escaping preserves every UTF-16 code unit, including malformed text.
 return {format:'wod-config-recovery',version:1,kind,raw:record.raw};
}
export function clearUnreadableComparison(storage,expected){
 if(typeof expected!=='string')throw Error('没有可清除的不可读A。');
 const current=storage.getItem(COMPARISON_KEY);
 if(current!==expected)throw Error('对比方案A已改变，未清除最新内容。');
 if(!decode(current,true).error)throw Error('这份A仍可读取，未按损坏内容清除。');
 // Snapshot guard, not a cross-process lock. Removal itself is one atomic storage call.
 storage.removeItem(COMPARISON_KEY);
}
