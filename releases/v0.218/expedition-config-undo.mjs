import {clone} from './expedition-data.mjs';
import {validate} from './expedition-engine.mjs';
import {validateGuild} from './expedition-guild.mjs';

// One in-memory configuration load, with only its companion-role delta.
// Never retain a guild snapshot that could roll back earned assets or rewards.
export function configurationUndo(config,beforeGuild,afterGuild){
 validate(config);const undo={config:clone(config),roles:null};
 if(beforeGuild===undefined&&afterGuild===undefined)return undo;
 validateGuild(beforeGuild);validateGuild(afterGuild);
 const {command:before,...beforeRest}=beforeGuild,{command:after,...afterRest}=afterGuild;
 if(JSON.stringify(beforeRest)!==JSON.stringify(afterRest)||before?.heroId!==after?.heroId||Boolean(before)!==Boolean(after))throw Error('配置撤销只能附带本次伙伴职责变化');
 const changes=[...new Set([...Object.keys(before?.companions||{}),...Object.keys(after?.companions||{})])].flatMap(id=>{
  const old=before.companions[id]??null,next=after.companions[id]??null;
  return old===next?[]:[{id,before:old,after:next}];
 });
 if(changes.length)undo.roles={heroId:before.heroId,lineup:clone(beforeGuild.lineup),next:beforeGuild.next,changes};
 return undo;
}

export function restoreConfigurationUndo(g,undo){
 if(!undo)throw Error('没有可撤销的方案载入');validate(undo.config);
 const config=clone(undo.config),roles=undo.roles;if(!roles)return {config,guild:null};
 validateGuild(g);
 if(g.pending)throw Error('请先领取远征结算，当前配置与伙伴职责未撤销');
 if(g.next!==roles.next)throw Error('已进行新的远征，原伙伴职责撤销已过期');
 if(g.command?.heroId!==roles.heroId||JSON.stringify(g.lineup)!==JSON.stringify(roles.lineup))throw Error('主角或出战队伍已变化，原伙伴职责撤销已过期');
 if(roles.changes.some(c=>(g.command.companions[c.id]??null)!==c.after))throw Error('本次涉及的伙伴职责已另行调整，配置与职责均未撤销');
 const guild=clone(g);
 for(const c of roles.changes){if(c.before===null)delete guild.command.companions[c.id];else guild.command.companions[c.id]=c.before;}
 validateGuild(guild);return {config,guild};
}

// localStorage writes are individually atomic. If the second write fails,
// restore the first before allowing the UI to consume its undo record.
export function commitPreparationChange(storage,{configKey,guildKey,expectedConfig,expectedGuild,config,guild}){
 validate(config);validateGuild(guild);
 if(!configKey||!guildKey||configKey===guildKey)throw Error('准备配置存储位置无效');
 const previousConfig=storage.getItem(configKey),previousGuild=storage.getItem(guildKey);
 if(previousGuild!==expectedGuild)throw Error('另一页面已修改公会，请重新进入公会后再操作');
 if(previousConfig!==expectedConfig)throw Error('另一页面已修改准备配置，请先导出当前草稿并刷新页面');
 const configRaw=JSON.stringify(config),guildRaw=JSON.stringify(guild);
 try{storage.setItem(configKey,configRaw);}catch(e){throw Error('准备配置保存失败，伙伴职责未修改：'+e.message);}
 try{storage.setItem(guildKey,guildRaw);}catch(e){
  try{if(previousConfig===null)storage.removeItem(configKey);else storage.setItem(configKey,previousConfig);}
  catch(rollback){throw Error('公会保存失败，准备配置回退也失败；请导出当前草稿和公会备份后检查本机存储：'+rollback.message);}
  throw Error('公会保存失败，准备配置已回退，伙伴职责未修改：'+e.message);
 }
 return {guildRaw,configRaw};
}
