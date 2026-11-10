export const PREPARATION_KEY='abbey-expedition-v40';
export class DraftConflict extends Error{constructor(){super('另一页面已修改准备配置，本页调整未保存。请先导出本页草稿，或载入最新准备配置后再调整。');this.name='DraftConflict';}}
// A stale-snapshot check, not a multiprocess lock or a server transaction.
export function commitDraft(storage,config,expected){if(!config||typeof config!=='object'||Array.isArray(config))throw Error('准备配置无效');const next=JSON.stringify(config),current=storage.getItem(PREPARATION_KEY);if(current===next)return current;if(current!==expected)throw new DraftConflict();storage.setItem(PREPARATION_KEY,next);return next;}
export function assertCurrentDraft(storage,config){if(storage.getItem(PREPARATION_KEY)!==JSON.stringify(config))throw new DraftConflict();}
