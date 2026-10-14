import {maintenanceDueState} from '../../shared/domain-maintenance.mjs';

const text=(value,label)=>{if(typeof value!=='string'||!value.trim())throw new TypeError(`${label} is required.`);return value.trim();};

export function createPreventiveProgram({id,name,planIds=[],metadata={}}={}){
  const unique=[...new Set(planIds.map(item=>text(item,'Plan id')))];
  if(!unique.length)throw new Error('Preventive program requires at least one plan.');
  return Object.freeze({id:text(id,'Program id'),name:text(name,'Program name'),planIds:Object.freeze(unique),metadata:Object.freeze({...metadata})});
}

export function buildPreventiveOsDraft({program,plan,dueState=maintenanceDueState(plan)}={}){
  if(!program?.planIds?.includes(plan?.id))throw new Error('Maintenance plan is not part of preventive program.');
  if(!dueState?.due)throw new Error('Maintenance plan is not due.');
  return Object.freeze({title:plan.name,assetId:plan.assetId,source:'preventive-maintenance',externalProgramId:program.id,externalPlanId:plan.id,description:`Preventive maintenance due by ${dueState.dueAt}.`,metadata:Object.freeze({metric:dueState.metric})});
}

export * from './catalog.js';
export * from './operations.js';
export * from './finance.js';
export * from './inventory.js';
export * from './documents.js';
export * from './security.js';
