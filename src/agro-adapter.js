import { createAgroEvent } from "./agro-contract-v1.js";
export function createFleetAgroAdapter(){const source="frota-manutencao";return {
 fuelingRecorded:(x)=>createAgroEvent({event:"fueling.recorded",source,entityId:x.machineId,data:{liters:x.liters,costMinor:x.costMinor,fuelType:x.fuelType},links:x.links||{}}),
 maintenanceCompleted:(x)=>createAgroEvent({event:"maintenance.completed",source,entityId:x.machineId,data:{maintenanceId:x.maintenanceId,costMinor:x.costMinor,description:x.description},links:x.links||{}}),
 machineCostUpdated:(x)=>createAgroEvent({event:"machine.cost.updated",source,entityId:x.machineId,data:{costPerHourMinor:x.costPerHourMinor},links:x.links||{}})
};}
