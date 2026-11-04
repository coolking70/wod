import {disruptionFixture} from './disruption-cases.mjs';
import {row} from '../dist/expedition-data.mjs';
export function cadenceFixture(mode='round',kind='early'){
 const f=disruptionFixture(kind);f.options.maxRounds=3;
 const d=f.config.heroes.find(h=>h.id==='d');d.main=[row('suppress','healer',mode),row('spark','healer')];
 f.config.heroes.find(h=>h.id==='e').prep=[row('rhythm','center')];
 const enemy=f.options.rooms[0].enemies[0];enemy.hp=10000;enemy.maxHp=20000;
 return f;
}
