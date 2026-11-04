import {hospiceConfig} from '../dist/expedition-data.mjs';
import {newGuild,depart,claim,learnAdvanced,guildConfig} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
// Earn all prerequisites through normal settlements; never inject experience or items.
export function seerGuild(){let g=selectHero(newGuild(),'c');while(g.members.find(m=>m.id==='d').xp<60)g=claim(depart(g,hospiceConfig('front')));return learnAdvanced(g,'d');}
export function seerCase(g,kind,seed){if(!['suppress','seer'].includes(kind))throw Error('Unknown seer case');const c=guildConfig(setCompanion(g,'d',kind),hospiceConfig('front'));c.seed=seed;return c;}
