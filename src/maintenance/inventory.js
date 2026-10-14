import {createProductInventoryService} from '../../shared/core.mjs';

export const createInventoryService=(persistence)=>createProductInventoryService(persistence,{namespace:'fleet-maintenance:maintenance'});
export const receiveMaintenancePart=(service,input)=>service.apply({...input,kind:'in'});
export const consumeWorkOrderPart=(service,input)=>service.apply({...input,kind:'out'});
