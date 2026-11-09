import {validEquipment,equipmentName} from './expedition-equipment.mjs';
export const EQUIPMENT_SET_SLOTS=[1,2,3,4];
export function validateEquipmentSets(m){if(m.equipmentSets===undefined)return;if(!Array.isArray(m.equipmentSets)||m.equipmentSets.length>4||new Set(m.equipmentSets.map(s=>s?.slot)).size!==m.equipmentSets.length)throw Error('个人配装册无效');for(const s of m.equipmentSets)if(!s||Object.keys(s).sort().join(',')!=='gear,name,slot'||!EQUIPMENT_SET_SLOTS.includes(s.slot)||typeof s.name!=='string'||s.name!==s.name.trim()||!s.name||s.name.length>40||!validEquipment(s.gear)||Object.values(s.gear).some(id=>!m.owned.includes(id)))throw Error('配装册含无效或未持有装备');}
export function equipmentSet(m,slot){if(!EQUIPMENT_SET_SLOTS.includes(slot))throw Error('配装栏位无效');const s=m.equipmentSets?.find(s=>s.slot===slot);if(!s)throw Error('此配装栏尚未保存');return s;}
export function setLabel(s){return `${s.name} · ${equipmentName(s.gear)}`;}
