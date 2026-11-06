import {UNIT_POOL_ENCODING,packUnitStates,unpackUnitStates} from './expedition-report-pool.mjs';
import {clone,POS,EXPEDITIONS,GEAR} from './expedition-data.mjs';
import {validate} from './expedition-engine.mjs';
import {validateCommand} from './expedition-command.mjs';
export const ARCHIVE_LIMITS=Object.freeze({slots:6,encodedChars:800000,rawBytes:12000000,configChars:100000});
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===[...keys].sort().join(',');
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const text=(s,max)=>typeof s==='string'&&s.length>0&&s.length<=max;
const supplies=s=>exact(s,['herb','rune','arrow'])&&Object.values(s).every(integer);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const base64Valid=s=>{if(typeof s!=='string'||!s.length||s.length>ARCHIVE_LIMITS.encodedChars||s.length%4||/[^A-Za-z0-9+/=]/.test(s))return false;const i=s.indexOf('=');return i<0||i>=s.length-2&&/^={1,2}$/.test(s.slice(i));};
export function archiveSummary(r){return {won:r.won,cleared:r.rooms.filter(v=>v.won).length,roomCount:r.rooms.length,rounds:r.rooms.map(v=>v.rounds),alive:r.party.filter(u=>u.hp>0).length,supplies:clone(r.supplies)};}
export function archiveUsage(entries=[]){return {count:entries.length,encodedChars:entries.reduce((n,e)=>n+e.snapshot.payload.length,0)};}
export function validateArchiveEntry(e){
 if(!exact(e,['version','id','title','source','route','ruleset','config','command','summary','original','snapshot'])||e.version!==1||!integer(e.id)||e.id<1||!text(e.title,40)||e.title.trim()!==e.title||!['history','pending','claimed'].includes(e.source)||!Object.hasOwn(EXPEDITIONS,e.route)||!text(e.ruleset,100))throw Error('收藏战报元数据无效');
 validate(e.config);if(e.config.expedition!==e.route||JSON.stringify(e.config).length>ARCHIVE_LIMITS.configChars)throw Error('收藏方案与路线不一致或过大');if(e.command!==null){if(!e.command||typeof e.command!=='object'||Array.isArray(e.command))throw Error('收藏角色视角无效');validateCommand(e.command);}
 const s=e.summary;if(!exact(s,['won','cleared','roomCount','rounds','alive','supplies'])||typeof s.won!=='boolean'||!integer(s.cleared)||!integer(s.roomCount)||s.roomCount<1||s.roomCount>8||s.cleared>s.roomCount||!Array.isArray(s.rounds)||s.rounds.length!==s.roomCount||s.rounds.some(n=>!integer(n)||n>24)||!integer(s.alive)||s.alive>6||!supplies(s.supplies))throw Error('收藏战报摘要无效');
 const o=e.original;if(!exact(o,['won','cleared','gold','xp','firstClear','loot'])||typeof o.won!=='boolean'||typeof o.firstClear!=='boolean'||![o.cleared,o.gold,o.xp].every(integer)||!Array.isArray(o.loot)||o.loot.some(id=>!Object.hasOwn(GEAR,id)))throw Error('收藏来源记录无效');
 const p=e.snapshot;if(!(p?.encoding==='gzip-base64'?exact(p,['encoding','rawBytes','compressedBytes','sha256','payload']):p?.encoding===UNIT_POOL_ENCODING&&exact(p,['encoding','rawBytes','compressedBytes','sha256','payload','packedBytes'])&&integer(p.packedBytes)&&p.packedBytes>0&&p.packedBytes<p.rawBytes)||!integer(p.rawBytes)||p.rawBytes<1||p.rawBytes>ARCHIVE_LIMITS.rawBytes||!integer(p.compressedBytes)||p.compressedBytes<18||typeof p.sha256!=='string'||!/^[a-f0-9]{64}$/.test(p.sha256)||!base64Valid(p.payload))throw Error('收藏压缩数据无效或超过上限');
 return e;
}
export function validateArchiveStore(entries,next){if(entries===undefined)return;if(!Array.isArray(entries)||entries.length>ARCHIVE_LIMITS.slots||new Set(entries.map(e=>e?.id)).size!==entries.length)throw Error('收藏至多6份，编号不可重复');for(const e of entries){validateArchiveEntry(e);if(e.id>=next)throw Error('收藏编号超出当前远征记录');}if(archiveUsage(entries).encodedChars>ARCHIVE_LIMITS.encodedChars)throw Error('收藏容量不足，请先导出并移除旧快照');}
function unit(u){if(!u||!text(u.id,100)||!text(u.name,100)||!Object.hasOwn(POS,u.pos)||!['party','enemy'].includes(u.side)||![u.hp,u.maxHp,u.mp,u.maxMp].every(integer)||u.maxHp<1||u.hp>u.maxHp||u.mp>u.maxMp||!Array.isArray(u.effects)||u.effects.length>128||u.effects.some(f=>!f||!text(f.name,200)))throw Error('冻结快照的单位状态无效');}
export function validateFrozenReport(r){
 const stack=[[r,0]],seen=new WeakSet();while(stack.length){const [value,depth]=stack.pop();if(typeof value==='number'&&!Number.isFinite(value))throw Error('冻结战报含无效数字');if(value&&typeof value==='object'&&!seen.has(value)){if(depth>128)throw Error('冻结战报嵌套过深');seen.add(value);for(const child of Object.values(value))stack.push([child,depth+1]);}}
 if(!r||typeof r!=='object'||typeof r.won!=='boolean'||!text(r.ruleset,100))throw Error('不是有效的完整战报');validate(r.config);if(r.version!==r.config.version)throw Error('快照与方案版本不一致');if(r.perspective!==undefined)validateCommand(r.perspective);
 if(!Array.isArray(r.party)||r.party.length!==6||new Set(r.party.map(u=>u.id)).size!==6||r.party.some(u=>!r.config.heroes.some(h=>h.id===u.id)))throw Error('冻结战报须为完整六人正式队伍');for(const u of r.party)unit(u);
 if(!Array.isArray(r.rooms)||r.rooms.length<1||r.rooms.length>8||r.rooms.some(v=>!v||!text(v.name,200)||typeof v.won!=='boolean'||!integer(v.rounds)||v.rounds>24)||!supplies(r.supplies)||!r.stats||typeof r.stats!=='object'||Array.isArray(r.stats))throw Error('冻结战报结算无效');
 for(const u of r.party){const s=r.stats[u.id];if(!s||!['damage','actual','overkill','healing','interrupts','failed','defenses','defenseMana'].every(k=>integer(s[k])))throw Error('冻结战报队员统计无效');}
 if(!Array.isArray(r.events)||!r.events.length||r.events.length>20000)throw Error('冻结战报事件无效');let previous=0;for(const e of r.events){if(!e||!integer(e.id)||e.id<=previous||!integer(e.roomIndex)||e.roomIndex>=r.rooms.length||!integer(e.round)||e.round>24||!text(e.type,100)||typeof e.text!=='string'||typeof e.phase!=='string'||!Array.isArray(e.targets)||e.targets.some(id=>!text(id,100))||(e.actor!==null&&!text(e.actor,100))||!Array.isArray(e.units)||e.units.length>40||new Set(e.units.map(u=>u.id)).size!==e.units.length||!supplies(e.supplies)||!e.detail||typeof e.detail!=='object'||Array.isArray(e.detail))throw Error('冻结战报事件序列无效');previous=e.id;for(const u of e.units)unit(u);}
 return r;
}
async function boundedBytes(stream,limit){const reader=stream.getReader(),chunks=[];let size=0;try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit){const error=Error('战报解压大小超过上限');error.code='ARCHIVE_STREAM_LIMIT';throw error;}chunks.push(value);}const out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}return out;}finally{await reader.cancel().catch(()=>{});}}
async function digest(bytes){if(!globalThis.crypto?.subtle)throw Error('当前页面无法校验快照，请使用本机或HTTPS地址');return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');}
function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=4096)s+=String.fromCharCode(...bytes.subarray(i,i+4096));return btoa(s);}
async function compressCandidate(bytes){try{return await boundedBytes(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')),Math.floor(ARCHIVE_LIMITS.encodedChars*3/4));}catch(error){if(error.code==='ARCHIVE_STREAM_LIMIT')return null;throw error;}}
export async function freezeReport(report){
 validateFrozenReport(report);const text=JSON.stringify(report),bytes=new TextEncoder().encode(text);if(bytes.length>ARCHIVE_LIMITS.rawBytes)throw Error('完整战报超过12MB收藏上限，请先导出文件');if(typeof CompressionStream!=='function')throw Error('当前浏览器不支持战报压缩，请先导出文件');
 const packed=new TextEncoder().encode(JSON.stringify(packUnitStates(JSON.parse(text)))),[plain,pooled]=await Promise.all([compressCandidate(bytes),packed.length<bytes.length?compressCandidate(packed):null]);
 const usePool=pooled&&(!plain||Math.ceil(pooled.length/3)<Math.ceil(plain.length/3)),compressed=usePool?pooled:plain;if(!compressed)throw Error('收藏压缩数据超过上限，请先导出文件');
 return{encoding:usePool?UNIT_POOL_ENCODING:'gzip-base64',rawBytes:bytes.length,compressedBytes:compressed.length,sha256:await digest(bytes),payload:base64(compressed),...(usePool?{packedBytes:packed.length}:{})};
}
export async function thawArchive(entry){
 validateArchiveEntry(entry);if(typeof DecompressionStream!=='function')throw Error('当前浏览器不支持快照解压');const p=entry.snapshot,binary=atob(p.payload),zip=Uint8Array.from(binary,c=>c.charCodeAt(0));if(zip.length!==p.compressedBytes)throw Error('收藏压缩长度不匹配');
 const pooled=p.encoding===UNIT_POOL_ENCODING,wireBytes=pooled?p.packedBytes:p.rawBytes,bytes=await boundedBytes(new Blob([zip]).stream().pipeThrough(new DecompressionStream('gzip')),Math.min(ARCHIVE_LIMITS.rawBytes,wireBytes));if(bytes.length!==wireBytes)throw Error('收藏快照校验失败，原存档未修改');
 let report,raw=bytes;if(pooled){report=unpackUnitStates(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),p.rawBytes,ARCHIVE_LIMITS.rawBytes);raw=new TextEncoder().encode(JSON.stringify(report));}
 if(raw.length!==p.rawBytes||await digest(raw)!==p.sha256)throw Error('收藏快照校验失败，原存档未修改');if(!pooled)report=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
 validateFrozenReport(report);if(report.ruleset!==entry.ruleset||!same(report.config,entry.config)||!same(report.perspective||null,entry.command)||!same(archiveSummary(report),entry.summary))throw Error('冻结快照与收藏摘要不一致');return report;
}
export async function validateArchivePayloads(entries=[]){for(const e of entries)await thawArchive(e);}
export function archiveFrame(report,index){if(!Number.isInteger(index)||index<0||index>=report.events.length)throw Error('收藏回放位置无效');return clone(report.events[index]);}
