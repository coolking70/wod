'use strict';
const {createHash}=require('node:crypto');
// HTTP304 validates a cached representation and carries no response body.
// Some browser transports expose a revalidated cached representation as200.
// Keep arrival metadata and attach error handling before an event callback returns.
function createSVGResponseObserver(){
 const responses=[],bodyTasks=[],errors=[];
 function observe(response){
  const entry={status:response.status(),headers:response.headers()};responses.push(entry);
  if(entry.status===304){entry.cacheValidationHasNoBody=true;return;}
  if(entry.status!==200){errors.push({status:entry.status,error:'Unexpected SVG HTTP status'});return;}
  const task=Promise.resolve().then(()=>response.body()).then(data=>{entry.bytes=data.length;entry.sha256=createHash('sha256').update(data).digest('hex');}).catch(error=>{errors.push({status:entry.status,error:error?.stack||String(error)});});
  bodyTasks.push(task);
 }
 return {responses,bodyTasks,errors,observe};
}
module.exports={createSVGResponseObserver};
