import {clone,SKILLS,theaterConfig} from '../dist/expedition-data.mjs';
export const MEDIA_CASES={standard:{},memoryMage:{c:'memory'},scribeScholar:{d:'scribed'},mixed:{c:'memory',d:'scribed'}};
// Research configurations only: same route,24 supplies and actual guild assets.
export function applyCastingMedia(config,assignments){const c=clone(config);for(const h of c.heroes){if(!Object.hasOwn(assignments,h.id))continue;for(const plan of [h,...Object.values(h.overrides)])for(const phase of ['prep','main'])for(const r of plan[phase]||[])if(SKILLS[r.skill].item==='rune'){if(assignments[h.id]==='standard')delete r.medium;else r.medium=assignments[h.id];}}return c;}
export function mediaTheater(mode='standard'){if(!Object.hasOwn(MEDIA_CASES,mode))throw Error('未知媒介实验');return applyCastingMedia(theaterConfig('cleanse'),MEDIA_CASES[mode]);}
