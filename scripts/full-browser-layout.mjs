import {isAbsolute,resolve,relative} from 'node:path';
const inside=(a,b)=>{const r=relative(a,b);return r===''||(!r.startsWith('..')&&!isAbsolute(r));};
export function fullBrowserLayout({root,caseRoot=null,receiptRoot=null,treeArchives=false}){
 if(!root||!isAbsolute(root)||caseRoot&&!isAbsolute(caseRoot)||receiptRoot&&!isAbsolute(receiptRoot))throw Error('Full browser evidence paths must be explicit absolute paths');
 root=resolve(root);const out=caseRoot?resolve(caseRoot):root,receipts=receiptRoot?resolve(receiptRoot):null;
 if(treeArchives){if(!caseRoot||!receipts||receipts!==root||inside(root,out)||inside(out,root))throw Error('Tree archive mode requires disjoint case/control roots and receipts in the owned control root');}
 else if(out!==root)throw Error('Separate full browser case root requires explicit tree archive mode');
 return {root,out,receiptRoot:receipts,treeArchives:Boolean(treeArchives),checkpointZIPs:!treeArchives,evidenceRecoveryPending:Boolean(treeArchives)};
}
