
/* UI action contracts. These map to existing RPC action names; no second data store. */
export const ACTION_LABELS = Object.freeze({
  save:'Salvar',remove:'Excluir veículo',create:'Criar',addItem:'Adicionar item',
  authorize:'Autorizar OS',start:'Iniciar OS',complete:'Concluir OS',cancel:'Cancelar OS',
  receive:'Entrada de estoque',consume:'Saída de estoque',reserve:'Reservar peças',
  release:'Liberar reserva',addExpense:'Registrar despesa',csv:'Exportar CSV',
  issue:'Registrar emissão',backup:'Criar cópia local',restore:'Restaurar cópia'
});
export const REPORT_TYPES = [
  {value:'vehicle-cost',label:'Custos por veículo'},
  {value:'vehicle-documents',label:'Documentos da frota'}
];
const f=(key,label,type='text',extra={})=>({key,label,type,...extra});
const choice=(key,label,options,extra={})=>f(key,label,'select',{options,...extra});
const assetChoice=(vehicles)=>choice('assetId','Veículo',vehicles.map(v=>({value:v.assetId,label:(v.plate||v.assetId)+' · '+v.assetId})),{required:true});
const money=(key,label,extra={})=>f(key,label,'money',{min:0,...extra});
const num=(key,label,extra={})=>f(key,label,'number',{min:0,...extra});
const triggerTypes=[
 {value:'odometer',label:'Quilometragem (km)'},{value:'hourmeter',label:'Horímetro (h)'},{value:'calendar-days',label:'Dias corridos'}
];
export function getActionFields(screen,action,{selected=null,vehicles=[],backups=[]}={}){
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
 if(screen==='work-orders'&&action==='cancel')return [f('reason','Motivo do cancelamento','textarea',{required:true})];
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
 if(action==='save'&&existing&&['fleet','preventive-plans','checklists'].includes(screen)){
  if(screen==='fleet')payload.assetId=existing.assetId;
  else if(screen==='preventive-plans')payload.id=existing.id;
  else payload.id=existing.id;
 }
 if((screen==='preventive-plans'&&action==='create')||(screen==='work-orders'&&action==='create')||
    (screen==='finance'&&action==='addExpense')||(screen==='checklists'&&action==='save'&&!existing))payload.id=uuid();
 if(screen==='work-orders'&&action==='addItem'){
  payload.item.id=uuid();
 }
 if((screen==='work-orders'&&action!=='create')||(screen==='fleet'&&action==='remove')||
    (screen==='readings'&&action==='save'))payload.id=existing?.id??existing?.assetId;
 if(screen==='readings'&&action==='save')payload.assetId=existing?.assetId;
 if(screen==='work-orders'&&action!=='create')payload.id=existing?.id;
 if(selected?.version!=null&&['save','remove','addItem','authorize','start','complete','cancel'].includes(action))
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
 if(screen==='inventory')return ['receive','consume','reserve','release'];
 if(screen==='checklists')return ['save'];
 if(screen==='finance')return ['addExpense'];
 if(screen==='reports')return ['csv','issue'];
 if(screen==='settings')return backups.length?['backup','restore']:['backup'];
 return [];
}
export const isDestructive=(screen,action)=>action==='remove'||action==='restore'||(screen==='work-orders'&&action==='cancel');
