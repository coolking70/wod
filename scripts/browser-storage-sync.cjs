// A writer's synchronous setItem completion is not a cross-page delivery barrier.
// Listen before writing; await the actual matching localStorage notification, then
// callers still assert the whole reader and writer snapshots themselves.
async function watchStorage(page,key){
 const handle=await page.evaluateHandle(k=>{const events=[],listener=e=>{if(e.key===k&&e.storageArea===localStorage)events.push({oldValue:e.oldValue,newValue:e.newValue,observed:localStorage.getItem(k)});};addEventListener('storage',listener);return{events,dispose:()=>removeEventListener('storage',listener)};},key);
 return{mark:()=>handle.evaluate(h=>h.events.length),async waitForRaw(value,{after=0}={}){await page.waitForFunction(({h,value,after})=>h.events.slice(after).some(e=>e.newValue===value),{h:handle,value,after},{timeout:15000});return handle.evaluate((h,{value,after})=>h.events.slice(after).find(e=>e.newValue===value),{value,after});},async dispose(){await handle.evaluate(h=>h.dispose());await handle.dispose();}};
}
module.exports={watchStorage};
