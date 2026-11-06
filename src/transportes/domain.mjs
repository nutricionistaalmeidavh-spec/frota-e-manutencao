// Adaptado do domínio aberto de ArtiSys Transportes para a distribuição standalone.
// Todas as referências apontam para identidades canônicas do Frota.
const required=(v,label)=>{const s=String(v??'').trim();if(!s)throw new Error(label+' obrigatório.');return s};
const positiveMoney=(v,label)=>{if(!Number.isSafeInteger(v)||v<=0)throw new Error(label+' deve ser positivo em centavos.');return v};
const nonNegative=(v,label)=>{if(!Number.isFinite(v)||v<0)throw new Error(label+' deve ser não negativo.');return v};
const instant=(v,label)=>{const d=new Date(v);if(!Number.isFinite(d.getTime()))throw new Error(label+' inválida.');return d.toISOString()};
export function createFreightContract({id,customerPartyId,rateType,rateMinor}={}){
 if(!['fixed','per-km','per-ton'].includes(rateType))throw new Error('Tipo de tarifa inválido.');
 return Object.freeze({id:required(id,'Contrato'),customerPartyId:required(customerPartyId,'Cliente'),rateType,rateMinor:positiveMoney(rateMinor,'Tarifa')});
}
export function calculateFreightPrice(contract,{distanceKm=0,weightKg=0}={}){
 if(contract.rateType==='fixed')return contract.rateMinor;
 if(contract.rateType==='per-km'){if(!(distanceKm>0))throw new Error('Informe a distância da rota para cobrança por km.');return Math.round(contract.rateMinor*distanceKm)}
 if(!(weightKg>0))throw new Error('Informe o peso da carga para cobrança por tonelada.');
 return Math.round(contract.rateMinor*(weightKg/1000));
}
export function createRoutePlan({id,origin,destination,distanceKm,tollEstimateMinor=0}={}){
 return Object.freeze({id:required(id,'Rota'),origin:required(origin,'Origem'),destination:required(destination,'Destino'),distanceKm:nonNegative(distanceKm,'Distância'),tollEstimateMinor:nonNegative(tollEstimateMinor,'Pedágio estimado')});
}
export function createFreightOrder({id,customerPartyId,origin,destination,cargoDescription,priceMinor,contractId=null,routeId=null,weightKg=null}={}){
 return Object.freeze({id:required(id,'Frete'),customerPartyId:required(customerPartyId,'Cliente'),origin:required(origin,'Origem'),destination:required(destination,'Destino'),cargoDescription:required(cargoDescription,'Carga'),priceMinor:positiveMoney(priceMinor,'Valor do frete'),contractId,routeId,weightKg,status:'planned',statusEvents:[],incidents:[],createdAt:new Date().toISOString()});
}
export function dispatchFreight(order,{vehicleAssetId,driverPartyId,odometerStart,departedAt=new Date().toISOString()}={}){
 if(order.status!=='planned')throw new Error('Somente fretes planejados podem ser despachados.');
 return Object.freeze({...order,status:'in-transit',vehicleAssetId:required(vehicleAssetId,'Veículo'),driverPartyId:required(driverPartyId,'Motorista'),odometerStart:nonNegative(odometerStart,'Quilometragem de saída'),departedAt:instant(departedAt,'Data de saída')});
}
export function addFreightStatusEvent(order,{status,location=null,notes=null,occurredAt=new Date().toISOString()}={}){
 if(order.status!=='in-transit')throw new Error('Somente fretes em viagem aceitam eventos.');
 if(!['loading','in-transit','delivered'].includes(status))throw new Error('Evento de viagem não permitido.');
 const event={status,location,notes,occurredAt:instant(occurredAt,'Data do evento')};
 return Object.freeze({...order,statusEvents:[...(order.statusEvents??[]),event]});
}
export function registerFreightIncident(order,{incidentId,type,description,costMinor=0,occurredAt=new Date().toISOString()}={}){
 if(!['in-transit','completed'].includes(order.status))throw new Error('Frete não admite incidente neste estado.');
 const incident={id:required(incidentId,'Incidente'),type:required(type,'Tipo'),description:required(description,'Descrição'),costMinor:nonNegative(costMinor,'Custo previsto'),occurredAt:instant(occurredAt,'Data do incidente'),status:'open'};
 return Object.freeze({...order,incidents:[...(order.incidents??[]),incident]});
}
export function completeFreight(order,{odometerEnd,completedAt=new Date().toISOString(),proofDocumentRef=null}={}){
 if(order.status!=='in-transit')throw new Error('Somente fretes em viagem podem ser concluídos.');
 const end=nonNegative(odometerEnd,'Quilometragem de chegada');
 if(end<order.odometerStart)throw new Error('Quilometragem final não pode ser inferior à inicial.');
 return Object.freeze({...order,status:'completed',odometerEnd:end,distanceKm:end-order.odometerStart,completedAt:instant(completedAt,'Data de conclusão'),proofDocumentRef});
}
export function cancelFreight(order,{reason,cancelledAt=new Date().toISOString()}={}){
 if(['completed','cancelled'].includes(order.status))throw new Error('Frete encerrado não pode ser cancelado.');
 return Object.freeze({...order,status:'cancelled',cancelReason:required(reason,'Motivo'),cancelledAt:instant(cancelledAt,'Data de cancelamento')});
}
