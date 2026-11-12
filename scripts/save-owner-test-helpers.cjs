const assert=require('node:assert/strict');
const keys=['abbey-expedition-v40','abbey-plan-library-v1','abbey-expedition-v40-a','abbey-guild-v6'];
async function releaseWriter234(page){assert.equal(await page.locator('#save-ownership').getAttribute('data-save-ownership'),'writer');await page.locator('[data-save-release]').click();await page.waitForFunction(async()=>!(await navigator.locks.query()).held.some(l=>l.name==='wod/abbey-campaign-v1/single-writer'));}
async function assertWriter234(page){await page.waitForFunction(()=>document.body.dataset.saveOwnership==='writer');}
async function attemptReadonly234(page,selector){assert.ok(['readonly','released'].includes(await page.locator('#save-ownership').getAttribute('data-save-ownership')));const n=page.locator(selector);await n.focus();await n.press('Enter');}
async function waitSharedSave234(reader,writer){const snapshot=await writer.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),keys);await reader.waitForFunction(snapshot=>Object.entries(snapshot).every(([k,v])=>localStorage.getItem(k)===v),snapshot);}
async function resumeWriter234(reader,writer){await releaseWriter234(writer);await writer.close();await reader.reload({waitUntil:'networkidle'});await assertWriter234(reader);}
module.exports={releaseWriter234,assertWriter234,attemptReadonly234,waitSharedSave234,resumeWriter234};
