import {createFinancialEntry,summarizeFinancialEntries} from '../../shared/core.mjs';

export function createMaintenanceExpense(order,{id=`${order.id}:expense`,partyId=null,dueDate=null}={}){
  if(order.totalCostMinor<=0)throw new Error('Maintenance order has no cost to post.');
  return createFinancialEntry({id,direction:'expense',amountMinor:order.totalCostMinor,description:`Maintenance ${order.id}`,partyId,dueDate,allocation:{kind:'asset',id:order.assetId},metadata:{workOrderId:order.id,maintenanceType:order.type}});
}

export function maintenanceCostSummary(entries,{assetId=null}={}){
  const scoped=assetId?entries.filter(entry=>entry.allocation?.id===assetId):entries;
  return summarizeFinancialEntries(scoped);
}
