// Cooperative single-writer protocol. This is not a security boundary or a
// localStorage transaction, and cannot retrofit an already-open old version.
export const SAVE_LOCK_NAME='wod/abbey-campaign-v1/single-writer';
export const SAVE_KEYS=Object.freeze(['abbey-expedition-v40','abbey-plan-library-v1','abbey-expedition-v40-a','abbey-guild-v6']);
const guardedOwners=new WeakMap();
// Injected in-memory stores keep their existing API; the current browser store
// is registered by the boot guard. No persistent marker or payload migration.
export function assertSaveWrite(storage){guardedOwners.get(storage)?.assertWritable();}
export class SaveOwnershipError extends Error{constructor(reason='另一页面持有写入权，本页只读。请在可写页操作，或关闭/释放该页后重新载入本页。'){super(reason);this.name='SaveOwnershipError';}}
export function createSaveOwnership(locks,{timeoutMs=5000}={}){
 let state={status:'checking',reason:'正在核对本页写入权'},finish,releaseHold,timer,settled=false;const listeners=new Set(),ready=new Promise(r=>finish=r);
 const notify=()=>{for(const fn of listeners)fn({...state});};
 const set=(status,reason)=>{state={status,reason};if(!settled){settled=true;clearTimeout(timer);finish({...state});}notify();};
 const release=(reason='本页已停止保存，另一页面可取得写入权；本页保持只读。重新载入后才能尝试取得写入权并读取最新档案。')=>{set('released',reason);releaseHold?.();releaseHold=null;};
 if(!locks||typeof locks.request!=='function')set('unavailable','浏览器未提供安全的单页写入能力，本页只读。请导出可读取的存档，并在支持 Web Locks 的HTTPS或本机地址打开。');
 else{
  timer=setTimeout(()=>{if(!settled)set('unavailable','写入权核对超时，本页只读；没有保存或覆盖存档。可导出后重新载入再试。');},timeoutMs);
  try{Promise.resolve(locks.request(SAVE_LOCK_NAME,{mode:'exclusive',ifAvailable:true},lock=>{
   if(state.status!=='checking')return;
   if(!lock){set('readonly','另一页面持有写入权，本页只读。请在可写页操作，或关闭/释放该页后重新载入本页。');return;}
   const hold=new Promise(r=>releaseHold=r);set('writer','本页可保存；其他参与保护的页面只读。');return hold;
  })).catch(()=>{if(state.status==='checking')set('unavailable','无法取得浏览器写入权，本页只读；没有保存或覆盖存档。可导出后重新载入再试。');else if(state.status==='writer')release('浏览器写入权已中断，本页只读。请导出后重新载入核对。');});}
  catch{set('unavailable','无法请求浏览器写入权，本页只读；没有保存或覆盖存档。可导出后重新载入再试。');}
 }
 return {ready,get state(){return {...state};},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},assertWritable(){if(state.status!=='writer')throw new SaveOwnershipError(state.reason);},release,invalidate(){release('检测到另一页面或旧版本改写存档，本页已停止写入。先导出当前档及本页最后保存副本；关闭/更新旧版本页，再重新载入核对。');}};
}
export function installSaveStorageGuard(storage,ownership,{onWrite=()=>{}}={}){
 const proto=Object.getPrototypeOf(storage),keys=new Set(SAVE_KEYS);for(const name of ['setItem','removeItem','clear']){
  const descriptor=Object.getOwnPropertyDescriptor(proto,name);if(typeof descriptor?.value!=='function')throw Error('无法安装存档写入保护');const original=descriptor.value;
  Object.defineProperty(proto,name,{...descriptor,value:function(...args){const relevant=this===storage&&(name==='clear'||keys.has(String(args[0])));if(relevant)ownership.assertWritable();const result=Reflect.apply(original,this,args);if(relevant)onWrite();return result;}});
 }
 guardedOwners.set(storage,ownership);
}
