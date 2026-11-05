import {greenhouseConfig,scriptoriumConfig,theaterConfig,row} from '../dist/expedition-data.mjs';
export function stockFloorConfig(route='greenhouse',floor=4){
 const c={greenhouse:greenhouseConfig,scriptorium:scriptoriumConfig,theater:theaterConfig}[route]();
 const f=c.heroes.find(h=>h.id==='f');f.trained='mireflask';f.main=[{...row('mireflask','rear','round'),...(floor?{keepStock:floor}:{})},row('shot','rear')];
 return c;
}
