// Layout measurements only: no storage, animation clock or replay state.
export function mountReplayTransport({root,controls,transport,viewport=globalThis.window,Resize=globalThis.ResizeObserver,Mutation=globalThis.MutationObserver}){
 let disposed=false;
 const names=['--replay-toolbar-height','--replay-transport-height'],previous=names.map(n=>[root.style.getPropertyValue(n),root.style.getPropertyPriority(n)]);
 function update(){
  if(disposed)return;
  for(const [i,node]of [controls,transport].entries()){
   const box=node.getBoundingClientRect(),size=Number.isFinite(box.height)&&box.height>0&&box.width>0?Math.max(0,Math.ceil(box.height)+(i===1?20:0)):0,value=size+'px';
   if(root.style.getPropertyValue(names[i])!==value)root.style.setProperty(names[i],value);
  }
 }
 const resize=Resize?new Resize(update):null;resize?.observe(controls);resize?.observe(transport);
 const mutation=Mutation?new Mutation(update):null;
 // Ancestor visibility changes also cover browsers without ResizeObserver.
 for(let node=controls;node;node=node.parentElement)mutation?.observe(node,{attributes:true,attributeFilter:['hidden','class','data-view','data-workspace']});
 viewport?.addEventListener('resize',update);update();
 return{update,dispose(){if(disposed)return;disposed=true;resize?.disconnect();mutation?.disconnect();viewport?.removeEventListener('resize',update);for(const[i,name]of names.entries()){const[value,priority]=previous[i];if(value)root.style.setProperty(name,value,priority);else root.style.removeProperty(name);}}};
}
