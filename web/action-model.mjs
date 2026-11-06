
/* UI action contracts. These map to existing RPC action names; no second data store. */
export const ACTION_LABELS = Object.freeze({
  save:'Salvar',remove:'Excluir veículo',create:'Criar',addItem:'Adicionar item',
  authorize:'Autorizar OS',start:'Iniciar OS',complete:'Concluir OS',cancel:'Cancelar OS',
  receive:'Entrada de estoque',consume:'Saída de estoque',reserve:'Reservar peças',
  release:'Liberar reserva',addExpense:'Registrar despesa',csv:'Exportar CSV',
  issue:'Registrar emissão',backup:'Criar cópia local',restore:'Restaurar cópia',
  dispatch:'Iniciar viagem',event:'Atualizar andamento',incident:'Registrar ocorrência',tripExpense:'Despesa da viagem'
});
export const REPORT_TYPES = [
  {value:'vehicle-cost',label:'Custos por veículo'},
  {value:'vehicle-documents',label:'Documentos da frota'},
  {value:'freight-margin',label:'Resultado por viagem/frete'}
];
const f=(key,label,type='text',extra={})=>({key,label,type,...extra});
const choice=(key,label,options,extra={})=>f(key,label,'select',{options,...extra});
const assetChoice=(vehicles)=>choice('assetId','Veículo',vehicles.map(v=>({value:v.assetId,label:(v.plate||v.assetId)+' · '+v.assetId})),{required:true});
const money=(key,label,extra={})=>f(key,label,'money',{min:0,...extra});
const num=(key,label,extra={})=>f(key,label,'number',{min:0,...extra});
const triggerTypes=[
 {value:'odometer',label:'Quilometragem (km)'},{value:'hourmeter',label:'Horímetro (h)'},{value:'calendar-days',label:'Dias corridos'}
];
export function getActionFields(screen,action,{selected=null,vehicles=[],drivers=[],routes=[],contracts=[],backups=[]}={}){
 const vehicle=assetChoice(vehicles);
 if(screen==='fleet'&&action==='save')return [
  f('assetId','Código interno','text',{required:true,readOnly:!!selected,placeholder:'Ex.: CAM-001'}),
  f('plate','Placa','text',{required:true,placeholder:'ABC1D23'}),
  num('odometer','Quilometragem (km)'),num('hourmeter','Horímetro (h)')
 ];
 if(screen==='readings'&&action==='save')return [num('odometer','Quilometragem atual (km)',{required:true}),num('hourmeter','Horímetro atual (h)',{required:true})];
 if(screen==='preventive-plans'&&['create','save'].includes(action))return [
  vehicle,f('name','Nome do plano','text',{required:true,placeholder:'Ex.: Troca de óleo'}),
  choice('trigger.metric','Critério',triggerTypes,{required:true}),
  num('trigger.interval','Intervalo de manutenção',{required:true,min:0.001}),
  f('trigger.baseline','Leitura ou data inicial','baseline',{required:true})
 ];
 if(screen==='work-orders'&&action==='create')return [
  vehicle,choice('type','Tipo',[{value:'preventive',label:'Preventiva'},{value:'corrective',label:'Corretiva'}]),
  f('title','Título da OS','text',{required:true,placeholder:'Ex.: Revisão dos freios'}),
  choice('priority','Prioridade',[{value:'normal',label:'Normal'},{value:'high',label:'Alta'},{value:'urgent',label:'Urgente'}]),
  f('reportedIssue','Descrição do serviço','textarea',{required:false})
 ];
 if(screen==='work-orders'&&action==='addItem')return [
  choice('item.type','Tipo de item',[{value:'part',label:'Peça'},{value:'service',label:'Serviço'}]),
  f('item.description','Descrição','text',{required:true}),num('item.quantity','Quantidade',{required:true,min:0.001}),
  money('item.unitCostMinor','Custo unitário (R$)')
 ];
 if(screen==='work-orders'&&action==='authorize')return [f('authorizedByPartyId','Responsável pela autorização','text',{required:true})];
 if(screen==='work-orders'&&action==='start')return [f('technicianPartyId','Técnico responsável','text',{required:true})];
 if(screen==='work-orders'&&action==='complete')return [f('notes','Observações da conclusão','textarea'),num('meterReading','Leitura final (opcional)')];
 if(['work-orders','freights'].includes(screen)&&action==='cancel')return [f('reason','Motivo do cancelamento','textarea',{required:true})];
 if(screen==='inventory'&&['receive','consume','reserve','release'].includes(action))return [
  f('sku','Código da peça (SKU)','text',{required:true}),num('quantity','Quantidade',{required:true,min:0.001})
 ];
 if(screen==='checklists'&&action==='save')return [
  vehicle,f('title','Título da inspeção','text',{required:true}),
  choice('status','Situação',[{value:'pending',label:'Pendente'},{value:'ok',label:'Concluída'},{value:'attention',label:'Precisa de atenção'}]),
  f('notes','Observações','textarea')
 ];
 if(screen==='finance'&&action==='addExpense')return [
  vehicle,money('amountMinor','Valor (R$)',{required:true,min:0.01}),
  choice('category','Categoria',[{value:'maintenance',label:'Manutenção'},{value:'fuel',label:'Combustível'},{value:'parts',label:'Peças'},{value:'other',label:'Outros'}]),
  f('description','Descrição','text',{required:true}),f('dueDate','Vencimento (opcional)','date')
 ];
 if(screen==='reports'&&['csv','issue'].includes(action))return [choice('type','Relatório',REPORT_TYPES)];
 if(screen==='drivers'&&action==='save')return [
  f('partyId','Código do motorista','text',{required:true,readOnly:!!selected}),
  f('licenseNumber','Número da CNH','text',{required:true}),
  choice('licenseCategory','Categoria',[{value:'A',label:'A'},{value:'B',label:'B'},{value:'C',label:'C'},{value:'D',label:'D'},{value:'E',label:'E'}],{required:true}),
  f('licenseExpiresAt','Validade da CNH','date',{required:true}),
  choice('status','Situação',[{value:'active',label:'Ativo'},{value:'inactive',label:'Inativo'}])
 ];
 if(screen==='freight-routes'&&action==='save')return [
  f('id','Código da rota','text',{required:true,readOnly:!!selected}),
  f('origin','Origem','text',{required:true}),f('destination','Destino','text',{required:true}),
  num('distanceKm','Distância (km)',{required:true}),money('tollEstimateMinor','Pedágio estimado (R$)')
 ];
 if(screen==='freight-contracts'&&action==='save')return [
  f('id','Código do contrato','text',{required:true,readOnly:!!selected}),
  f('customerPartyId','Código do cliente','text',{required:true}),
  choice('rateType','Tipo de tarifa',[{value:'fixed',label:'Valor fixo'},{value:'per-km',label:'Por km'},{value:'per-ton',label:'Por tonelada'}],{required:true}),
  money('rateMinor','Valor da tarifa (R$)',{required:true,min:0.01})
 ];
 if(screen==='freights'&&action==='create')return [
  f('customerPartyId','Código do cliente','text',{required:true}),
  f('origin','Origem','text',{required:true}),f('destination','Destino','text',{required:true}),
  f('cargoDescription','Descrição da carga','textarea',{required:true}),
  choice('routeId','Rota cadastrada (opcional)',[{value:'',label:'Sem rota'},...routes.map(x=>({value:x.id,label:x.origin+' → '+x.destination}))]),
  choice('contractId','Contrato (opcional)',[{value:'',label:'Sem contrato'},...contracts.map(x=>({value:x.id,label:x.id+' · '+x.customerPartyId}))]),
  num('weightKg','Peso (kg) para tarifa por tonelada'),
  money('priceMinor','Valor do frete (R$) — opcional se houver contrato')
 ];
 if(screen==='freights'&&action==='dispatch')return [
  choice('vehicleAssetId','Veículo da frota',vehicles.map(v=>({value:v.assetId,label:(v.plate||v.assetId)+' · '+v.assetId})),{required:true}),
  choice('driverPartyId','Motorista cadastrado',drivers.filter(x=>x.status!=='inactive').map(v=>({value:v.partyId,label:v.partyId+' · CNH '+v.licenseNumber})),{required:true}),
  num('odometerStart','Quilometragem de saída',{required:true})
 ];
 if(screen==='freights'&&action==='event')return [
  choice('status','Etapa da viagem',[{value:'loading',label:'Carregamento'},{value:'in-transit',label:'Em trânsito'},{value:'delivered',label:'Entregue'}],{required:true}),
  f('location','Local (opcional)','text'),f('notes','Observações','textarea')
 ];
 if(screen==='freights'&&action==='incident')return [
  f('type','Tipo de ocorrência','text',{required:true}),f('description','Descrição','textarea',{required:true}),
  money('costMinor','Custo estimado (R$)')
 ];
 if(screen==='freights'&&action==='tripExpense')return [
  choice('category','Categoria',[{value:'fuel',label:'Combustível'},{value:'toll',label:'Pedágio'},{value:'food',label:'Alimentação'},{value:'maintenance',label:'Manutenção'},{value:'other',label:'Outros'}],{required:true}),
  f('description','Descrição da despesa','text',{required:true}),
  money('amountMinor','Valor (R$)',{required:true,min:0.01})
 ];
 if(screen==='freights'&&action==='complete')return [
  num('odometerEnd','Quilometragem de chegada',{required:true}),
  f('proofDocumentRef','Referência do comprovante de entrega','text')
 ];
 if(screen==='freights'&&action==='cancel')return [f('reason','Motivo do cancelamento','textarea',{required:true})];
 if(screen==='settings'&&action==='restore')return [choice('id','Cópia que será restaurada',backups.map(b=>({value:b.id,label:b.id+' · '+new Date(b.createdAt).toLocaleString('pt-BR')})),{required:true})];
 return [];
}
const getPath=(object,path)=>path.split('.').reduce((value,part)=>value?.[part],object);
function setPath(object,path,value){const parts=path.split('.');let parent=object;for(const part of parts.slice(0,-1))parent=parent[part]??=( {} );parent[parts[parts.length-1]]=value}
export function defaultDraft(fields,selected=null){
 const draft={};
 for(const field of fields){
  let value=getPath(selected?.payload??selected??{},field.key);
  if(field.type==='money'&&value!=null)value=Number(value)/100;
  if(field.type==='date'&&value)value=String(value).slice(0,10);
  if(field.type==='baseline'&&typeof value==='string')value=value.slice(0,10);
  draft[field.key]=value==null?(field.options?.[0]?.value??''):String(value);
 }
 return draft;
}
export function buildActionInput(screen,action,fields,draft,{selected=null,uuid=()=>crypto.randomUUID()}={}){
 const payload={};const raw=(key)=>draft[key];
 for(const field of fields){
  const input=String(raw(field.key)??'').trim();
  if(field.required&&!input)throw new Error('Preencha '+field.label+'.');
  if(!input&&!field.required)continue;
  let value=input;
  if(field.type==='number'||field.type==='money'||field.type==='baseline'){
   if(field.type==='baseline'&&draft['trigger.metric']==='calendar-days'){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(input))throw new Error('Informe a data inicial.');
    value=new Date(input+'T12:00:00').toISOString();
   } else {
    value=Number(input.replace(',','.'));
    if(!Number.isFinite(value)||value<(field.min??0))throw new Error('Confira o valor de '+field.label+'.');
    if(field.type==='money')value=Math.round(value*100);
   }
  }
  if(field.type==='date')value=new Date(input+'T12:00:00').toISOString();
  setPath(payload,field.key,value);
 }
 const existing=selected?.payload??selected??null;
 if(action==='save'&&existing&&['fleet','preventive-plans','checklists','drivers','freight-routes','freight-contracts'].includes(screen)){
  if(screen==='fleet')payload.assetId=existing.assetId;
  else if(screen==='drivers')payload.partyId=existing.partyId;
  else if(screen==='preventive-plans')payload.id=existing.id;
  else payload.id=existing.id;
 }
 if((screen==='preventive-plans'&&action==='create')||(screen==='work-orders'&&action==='create')||(screen==='freights'&&action==='create')||
    (screen==='finance'&&action==='addExpense')||(screen==='checklists'&&action==='save'&&!existing))payload.id=uuid();
 if(screen==='freights'&&action==='tripExpense')payload.expenseId=uuid();
 if(screen==='freights'&&action==='incident')payload.incidentId=uuid();
 if(screen==='work-orders'&&action==='addItem'){
  payload.item.id=uuid();
 }
 if((screen==='work-orders'&&action!=='create')||(screen==='fleet'&&action==='remove')||
    (screen==='readings'&&action==='save'))payload.id=existing?.id??existing?.assetId;
 if(screen==='readings'&&action==='save')payload.assetId=existing?.assetId;
 if(screen==='work-orders'&&action!=='create')payload.id=existing?.id;
 if(screen==='freights'&&action!=='create')payload.id=existing?.id;
 if(selected?.version!=null&&['save','remove','addItem','authorize','start','complete','cancel','dispatch','event','incident','tripExpense'].includes(action))
  payload.expectedVersion=selected.version;
 if(screen==='work-orders'&&action==='complete'&&!raw('meterReading'))delete payload.meterReading;
 if(screen==='fleet'&&action==='remove')return {id:existing.assetId,expectedVersion:selected.version};
 return payload;
}
export function allowedActions(screen,selected=null,{backups=[]}={}){
 const p=selected?.payload??selected;
 if(screen==='fleet')return p?['save','remove']:['save'];
 if(screen==='readings')return p?['save']:[];
 if(screen==='preventive-plans')return p?['create','save']:['create'];
 if(screen==='work-orders'){
  if(!p)return ['create'];
  const s=p.status;
  return ['create',...(s==='draft'||s==='authorized'?['addItem']:[]),
    ...(s==='draft'?['authorize']:[]),...(s==='authorized'?['start']:[]),
    ...(s==='in-progress'?['complete']:[]),...(!['completed','cancelled'].includes(s)?['cancel']:[])];
 }
 if(screen==='freights')return !p?['create']:['create',...(p.status==='planned'?['dispatch','cancel']:[]),...(p.status==='in-transit'?['event','incident','tripExpense','complete','cancel']:[]),...(p.status==='completed'?['incident','tripExpense']:[])];
 if(['drivers','freight-routes','freight-contracts'].includes(screen))return ['save'];
 if(screen==='inventory')return ['receive','consume','reserve','release'];
 if(screen==='checklists')return ['save'];
 if(screen==='finance')return ['addExpense'];
 if(screen==='reports')return ['csv','issue'];
 if(screen==='settings')return backups.length?['backup','restore']:['backup'];
 return [];
}
export const isDestructive=(screen,action)=>action==='remove'||action==='restore'||(['work-orders','freights'].includes(screen)&&action==='cancel');
