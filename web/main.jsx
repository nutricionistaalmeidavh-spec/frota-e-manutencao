
import React,{useEffect,useMemo,useState} from 'react';
import{createRoot}from'react-dom/client';
import{createBrowserPersistence,createBrowserRecovery}from'../shared/persistence-browser.mjs';
import{createFleetMaintenancePresentation}from'../src/presentation.js';
import{createRpcBackend}from'../runtime/backend.mjs';
import{ACTION_LABELS,allowedActions,buildActionInput,defaultDraft,getActionFields,isDestructive}from'./action-model.mjs';
import'./styles.css';

async function makeBackend(){
 if(globalThis.artisys)return globalThis.artisys;
 const persistence=createBrowserPersistence({productId:'fleet-maintenance'});
 const recovery=createBrowserRecovery(persistence);
 return createRpcBackend({presentation:createFleetMaintenancePresentation({persistence,recovery})});
}
const unwrap=(r)=>r?.payload??r;
const getRows=(screen,data)=>{
 if(screen==='inventory')return Object.values(data?.state??{}).map(v=>({payload:v,id:v.sku,version:data?.version}));
 if(screen==='reports')return data?.issued??[];
 if(screen==='settings')return(data?.backups??[]).map(v=>({payload:v,id:v.id}));
 return data?.rows??[];
};
const recordId=(r)=>String(unwrap(r)?.id??unwrap(r)?.assetId??unwrap(r)?.sku??r?.id??'');
const shortDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('pt-BR')};
const brl=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v??0)/100);
const numeric=v=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(Number(v??0));
const screenHelp={
 overview:'Acompanhe os principais números, pendências e custos da operação.',
 fleet:'Consulte, cadastre e atualize os veículos e máquinas da frota.',
 readings:'Registre quilometragem e horímetro sem perder o histórico de versão do veículo.',
 'preventive-plans':'Defina intervalos de manutenção por veículo e acompanhe os vencimentos.',
 'work-orders':'Acompanhe cada OS da abertura até a conclusão, com etapas e responsáveis.',
 schedule:'Ordens abertas organizadas para orientar o planejamento.',
 inventory:'Controle entradas, saídas e reservas de peças.',
 checklists:'Registre inspeções de segurança e observações por veículo.',
 finance:'Registre despesas e acompanhe o valor associado a cada veículo.',
 reports:'Exporte informações diretamente dos dados salvos no sistema.',
 settings:'Gerencie cópias de segurança locais com indicação do que será restaurado.'
};
const columns={
 fleet:[['assetId','Código'],['plate','Placa'],['odometer','KM'],['hourmeter','Horas']],
 readings:[['assetId','Código'],['plate','Placa'],['odometer','KM'],['hourmeter','Horas'],['lastReadingAt','Última leitura']],
 'preventive-plans':[['name','Plano'],['assetId','Veículo'],['trigger.metric','Critério'],['due.due','Situação']],
 'work-orders':[['id','OS'],['title','Descrição'],['assetId','Veículo'],['status','Situação'],['totalCostMinor','Valor']],
 schedule:[['id','OS'],['title','Descrição'],['assetId','Veículo'],['status','Situação'],['openedAt','Aberta em']],
 inventory:[['sku','Código da peça'],['onHand','Disponível + reservado'],['reserved','Reservado']],
 checklists:[['title','Inspeção'],['assetId','Veículo'],['status','Situação'],['notes','Observações']],
 finance:[['description','Despesa'],['allocation.id','Veículo'],['amountMinor','Valor'],['dueDate','Vencimento']],
 reports:[['type','Relatório emitido'],['issuedAt','Emissão'],['size','Tamanho']],
 settings:[['id','Cópia local'],['createdAt','Criada em']]
};
const columnValue=(row,key)=>key.split('.').reduce((o,k)=>o?.[k],key.startsWith('due.')?row:unwrap(row));
function formatValue(value,key){
 if(key==='due.due')return value?'Vencida':'Em dia';
 if(key.includes('Minor'))return brl(value);
 if(key==='createdAt'||key==='issuedAt'||key==='dueDate'||key==='openedAt'||key==='lastReadingAt')return shortDate(value);
 if(key==='trigger.metric')return({odometer:'Quilometragem',hourmeter:'Horímetro','calendar-days':'Dias corridos'})[value]??value;
 if(key==='status')return({draft:'Rascunho',authorized:'Autorizada','in-progress':'Em execução',completed:'Concluída',cancelled:'Cancelada',pending:'Pendente',ok:'Concluída',attention:'Atenção'})[value]??value;
 if(typeof value==='boolean')return value?'Sim':'Não';
 if(typeof value==='number')return numeric(value);
 if(value==null||value==='')return '—';
 if(typeof value==='object')return 'Ver detalhes';
 return String(value);
}
const navSections=[
 {name:'CONTROLE DA FROTA',items:['overview','fleet','readings']},
 {name:'MANUTENÇÃO',items:['preventive-plans','work-orders','schedule','inventory','checklists']},
 {name:'GESTÃO',items:['finance','reports','settings']}
];
const metrics=[
 ['vehicles','Veículos cadastrados',''],
 ['preventivePlans','Planos preventivos',''],
 ['maintenanceDue','Manutenções vencidas','warning'],
 ['openWorkOrders','Ordens em aberto',''],
 ['expiredDocuments','Documentos vencidos','warning'],
 ['fuelCostMinor','Custo combustível','money'],
 ['expenseMinor','Despesas registradas','money']
];
function App(){
 const [backend,setBackend]=useState(null),[hasUsers,setHasUsers]=useState(null);
 const [credentials,setCredentials]=useState({username:'admin',password:''});
 const [auth,setAuth]=useState(null),[meta,setMeta]=useState(null),[screen,setScreen]=useState('overview');
 const [data,setData]=useState(null),[vehicles,setVehicles]=useState([]),[busy,setBusy]=useState(false);
 const [message,setMessage]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const [chosen,setChosen]=useState(null),[panel,setPanel]=useState(null),[draft,setDraft]=useState({});
 const [search,setSearch]=useState(''),[mobileNav,setMobileNav]=useState(false),[refresh,setRefresh]=useState(0);
 useEffect(()=>{let alive=true;makeBackend().then(async b=>{const state=await b.authState();if(alive){setHasUsers(state.hasUsers);setBackend(b)}}).catch(e=>{if(alive)setError(e.message)});return()=>{alive=false}},[]);
 useEffect(()=>{let active=true;if(!backend||!auth)return;backend.describe().then(m=>{if(active){setMeta(m);setScreen(m.navigation[0]?.id??'overview')}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[backend,auth]);
 useEffect(()=>{let active=true;if(!backend||!auth||!meta)return;setLoading(true);setData(null);
   backend.load({screenId:screen,auth}).then(d=>{if(active)setData(d)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
   return()=>{active=false};
 },[backend,auth,meta,screen,refresh]);
 useEffect(()=>{let active=true;if(!backend||!auth)return;backend.load({screenId:'fleet',auth}).then(d=>{if(active)setVehicles((d.rows??[]).map(unwrap))}).catch(()=>{});return()=>{active=false}},[backend,auth,refresh]);
 const allRows=useMemo(()=>getRows(screen,data),[screen,data]);
 const filtered=useMemo(()=>allRows.filter(r=>!search||JSON.stringify(unwrap(r)).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))),[allRows,search]);
 const selected=allRows.find(r=>recordId(r)===chosen)??null;
 const title=meta?.screens?.find(s=>s.id===screen)?.title??meta?.navigation?.find(n=>n.id===screen)?.label??'Visão Geral';
 const actions=allowedActions(screen,selected,{backups:data?.backups??[]});
 const actionFields=panel?getActionFields(screen,panel,{selected,vehicles,backups:data?.backups??[]}):[];
 const sections=navSections.map(section=>({...section,items:section.items.filter(id=>meta?.navigation?.some(n=>n.id===id))}));
 const navigate=id=>{setScreen(id);setChosen(null);setPanel(null);setMessage(null);setError('');setSearch('');setMobileNav(false)};
 async function authenticate(e){e.preventDefault();if(busy||!backend)return;setBusy(true);setError('');
  try{if(!hasUsers){await backend.bootstrap(credentials);setHasUsers(true)}
   const session=await backend.login(credentials);setAuth({sessionId:session.session.id,token:session.token});
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function logout(){if(!backend||!auth)return;try{await backend.logout(auth)}catch{}setAuth(null);setMeta(null);setData(null);setChosen(null);setPanel(null);setError('');setCredentials(c=>({...c,password:''}))}
 const openAction=action=>{setPanel(action);setMessage(null);setError('');setDraft(defaultDraft(getActionFields(screen,action,{selected,vehicles,backups:data?.backups??[]}),selected))};
 async function submitAction(event){event.preventDefault();if(busy||!panel)return;
  setError('');let input;
  try{input=buildActionInput(screen,panel,actionFields,draft,{selected})}catch(e){setError(e.message);return}
  if(isDestructive(screen,panel)&&!window.confirm('Esta ação altera dados salvos. Deseja continuar?'))return;
  setBusy(true);const action=panel;
  try{
    const result=await backend.action({screenId:screen,action,input,auth});
    if(screen==='reports'&&action==='csv'){
      if(typeof result.content!=='string')throw Error('O relatório retornou sem conteúdo para exportação.');
      const file=new Blob(['\uFEFF'+result.content],{type:'text/csv;charset=utf-8'});
      const href=URL.createObjectURL(file),link=document.createElement('a');link.href=href;link.download=(input.type||'relatorio')+'.csv';document.body.append(link);link.click();link.remove();URL.revokeObjectURL(href);
    }
    const newData=await backend.load({screenId:screen,auth});setData(newData);
    setRefresh(n=>n+1);setPanel(null);setChosen(null);
    const label=ACTION_LABELS[action]??action;
    setMessage({kind:'success',text:label+' concluído. As informações exibidas foram atualizadas.'});
  }catch(e){setError(e.message||'A operação não pôde ser concluída. Confira os campos e tente novamente.')}
  finally{setBusy(false)}
 }
 if(!backend||hasUsers===null)return <div className="splash" role="status">Preparando ArtiSys Frota…</div>;
 if(!auth)return <div className="auth-layout"><section className="auth-hero"><span className="brand-glyph">A</span><p className="eyebrow">ARTISYS · GESTÃO LOCAL</p><h1>Sua frota sob controle, do pátio à manutenção.</h1><p>Veículos, ordens de serviço, peças e custos no mesmo fluxo de trabalho.</p><div className="hero-proof"><span>Dados locais</span><span>Sem assinatura obrigatória</span></div></section><form className="login-card" onSubmit={authenticate}><p className="eyebrow">ACESSO AO SISTEMA</p><h2>{hasUsers?'Entre na sua operação':'Configure seu administrador'}</h2><p>{hasUsers?'Use o usuário e a senha cadastrados neste computador.':'O primeiro acesso cria a conta administradora neste dispositivo.'}</p><label>Usuário<input data-testid="username" autoComplete="username" value={credentials.username} onChange={e=>setCredentials({...credentials,username:e.target.value})} required/></label><label>Senha<input data-testid="password" type="password" minLength="8" autoComplete={hasUsers?'current-password':'new-password'} value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})} required/></label>{error&&<p className="error-text" role="alert">{error}</p>}<button type="submit" className="primary" data-testid="auth-submit" disabled={busy}>{busy?'Aguarde…':hasUsers?'Entrar':'Criar administrador e entrar'}</button><small>O armazenamento da versão desktop permanece neste computador.</small></form></div>;
 if(!meta)return <div className="splash" role="status">Carregando área de trabalho…</div>;
 return <div className="app-shell">
   <button className="mobile-menu" type="button" onClick={()=>setMobileNav(v=>!v)} aria-label="Abrir navegação">☰ Menu</button>
   {mobileNav&&<button className="nav-scrim" aria-label="Fechar navegação" onClick={()=>setMobileNav(false)}/>}
   <aside className={'sidebar '+(mobileNav?'sidebar-open':'')}>
    <div className="sidebar-brand"><span className="brand-glyph">A</span><div><strong>ArtiSys</strong><small>FROTA & MANUTENÇÃO</small></div></div>
    <div className="sidebar-caption">AMBIENTE DE TRABALHO</div>
    {sections.map(section=><div className="nav-group" key={section.name}><p>{section.name}</p>{section.items.map(id=><button key={id} data-testid={'nav-'+id} type="button" onClick={()=>navigate(id)} className={'nav-link '+(id===screen?'on':'')} aria-current={id===screen?'page':undefined}><span className="nav-marker"/>{meta.navigation.find(x=>x.id===id)?.label??id}</button>)}</div>)}
    <div className="sidebar-footer"><span className="status-light"/> Dados armazenados localmente</div>
   </aside>
   <div className="workspace">
    <header className="topbar"><div><span className="eyebrow">CENTRAL OPERACIONAL</span><strong>{meta.brand.productName}</strong></div><div className="top-actions"><span className="local-chip">Modo local</span><button type="button" className="signout" onClick={logout}>Sair</button></div></header>
    <main className="main-area">
      <section className="page-heading"><div><span className="eyebrow">ÁREA DE TRABALHO / {title.toLocaleUpperCase('pt-BR')}</span><h1>{title}</h1><p>{screenHelp[screen]}</p></div>
       {screen==='overview'&&<button className="primary" type="button" onClick={()=>navigate('fleet')}>Gerenciar frota <span aria-hidden>→</span></button>}
      </section>
      {message&&<div className="notice notice-success" role="status">{message.text}<button type="button" aria-label="Fechar aviso" onClick={()=>setMessage(null)}>×</button></div>}
      {error&&!panel&&<div className="notice notice-error" role="alert">{error}<button type="button" aria-label="Fechar erro" onClick={()=>setError('')}>×</button></div>}
      {loading||data===null?<div className="loading-surface" role="status">Carregando informações…</div>:<>
       {screen==='overview'&&<><div className="metric-grid">{metrics.map(([key,label,kind])=><article className="metric-card" key={key}><span>{label}</span><strong className={kind==='warning'&&Number(data?.cards?.[key])>0?'caution':''}>{kind==='money'?brl(data?.cards?.[key]):numeric(data?.cards?.[key])}</strong><small>{kind==='warning'&&Number(data?.cards?.[key])>0?'Exige acompanhamento':'Atualizado a partir dos registros locais'}</small></article>)}</div>
       <div className="insight-panel"><div><span className="eyebrow">PRÓXIMOS PASSOS</span><h2>Por onde começar?</h2><p>Cadastre seus veículos, registre leituras e crie planos preventivos para acompanhar as ordens de serviço.</p></div><div className="quick-actions"><button onClick={()=>navigate('fleet')}>1. Cadastrar veículo <span>→</span></button><button onClick={()=>navigate('preventive-plans')}>2. Criar plano preventivo <span>→</span></button><button onClick={()=>navigate('work-orders')}>3. Acompanhar OS <span>→</span></button></div></div></>}
       {screen!=='overview'&&<section className="content-panel"><div className="section-header"><div><h2>{screen==='inventory'?'Posição atual de estoque':screen==='reports'?'Emissões registradas':screen==='settings'?'Cópias de segurança':'Registros'}</h2><p>{allRows.length} registro{allRows.length===1?'':'s'} {search?'· '+filtered.length+' encontrado(s)':''}</p></div><div className="panel-actions">{allRows.length>0&&<label className="search-label"><span className="sr-only">Buscar registros</span><input type="search" placeholder="Buscar registros…" value={search} onChange={e=>setSearch(e.target.value)}/></label>}{actions.filter(a=>!selected||['create','addExpense','backup','csv','issue','receive'].includes(a)).slice(0,2).map(a=><button className={a==='save'||a==='create'||a==='addExpense'?'primary':'secondary'} key={a} onClick={()=>openAction(a)} type="button">{a==='save'&&screen==='fleet'&&!selected?'Novo veículo':ACTION_LABELS[a]??a}</button>)}</div></div>
       {screen==='settings'&&<p className="help-banner">As cópias do navegador ficam no armazenamento local deste dispositivo. Para não perder dados ao limpar o navegador, mantenha uma cópia externa conforme sua política de backup.</p>}
       {!filtered.length?<div className="empty-view"><span className="empty-symbol">○</span><h3>{search?'Nenhum registro encontrado':'Ainda não há registros aqui'}</h3><p>{search?'Altere a busca para ver os demais registros.':'Use uma das ações disponíveis para começar. Quando houver dados, eles aparecerão nesta lista.'}</p></div>:
       <div className="table-scroll"><table><thead><tr>{(columns[screen]??[]).map(([key,label])=><th key={key}>{label}</th>)}<th>Detalhes</th></tr></thead><tbody>{filtered.map(row=><tr key={recordId(row)} className={chosen===recordId(row)?'selected-row':''}><React.Fragment>{(columns[screen]??[]).map(([key])=><td key={key}><span className={key==='status'?'status-pill':''}>{formatValue(columnValue(row,key),key)}</span></td>)}</React.Fragment><td><button className="row-action" onClick={()=>{setChosen(chosen===recordId(row)?null:recordId(row));setPanel(null);setMessage(null)}} aria-label={'Ver detalhes de '+recordId(row)} type="button">{chosen===recordId(row)?'Ocultar':'Ver detalhes'} →</button></td></tr>)}</tbody></table></div>}
       {selected&&<div className="record-detail"><div><p className="eyebrow">REGISTRO SELECIONADO</p><h3>{unwrap(selected)?.title??unwrap(selected)?.name??unwrap(selected)?.plate??recordId(selected)}</h3><p>Identificador: {recordId(selected)}{selected.version!=null?' · Revisão '+selected.version:''}</p></div><div className="detail-actions">{actions.filter(a=>!(a==='create')&&!(a==='save'&&screen==='fleet')).map(a=><button key={a} type="button" className={isDestructive(screen,a)?'danger-action':'secondary'} onClick={()=>openAction(a)}>{ACTION_LABELS[a]??a}</button>)}{screen==='fleet'&&<button className="secondary" onClick={()=>openAction('save')}>Editar veículo</button>}</div></div>}
       {screen==='work-orders'&&selected&&<p className="help-banner">As ações disponíveis seguem a etapa atual da OS. Para avançar, autorize, inicie e conclua a ordem conforme seu estado.</p>}
       {screen==='inventory'&&<div className="footer-actions">{['receive','consume','reserve','release'].map(a=><button key={a} type="button" className="secondary" onClick={()=>openAction(a)}>{ACTION_LABELS[a]}</button>)}</div>}
       </section>}
       </>}
    </main>
   </div>
   {panel&&<div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy){setPanel(null);setError('')}}}><section className="form-panel" role="dialog" aria-modal="true" aria-labelledby="form-heading"><div className="form-head"><div><span className="eyebrow">ALTERAR DADOS</span><h2 id="form-heading">{ACTION_LABELS[panel]??panel}</h2><p>{selected?'Registro: '+recordId(selected):'Preencha os campos e confirme a ação.'}</p></div><button className="close" aria-label="Fechar formulário" type="button" disabled={busy} onClick={()=>{setPanel(null);setError('')}}>×</button></div>
    <form onSubmit={submitAction}><div className="field-grid">{actionFields.length? actionFields.map(field=><label key={field.key} className={field.type==='textarea'?'wide-field':''}><span>{field.label}{field.required?' *':''}</span>{field.type==='textarea'?<textarea rows={4} value={draft[field.key]??''} onChange={e=>setDraft(d=>({...d,[field.key]:e.target.value}))}/>:
       field.type==='select'?<select value={draft[field.key]??''} required={field.required} onChange={e=>setDraft(d=>({...d,[field.key]:e.target.value}))}>{!field.options?.length&&<option value="">Nenhuma opção disponível</option>}{(field.options??[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:
       <input data-testid={'field-'+field.key.replaceAll('.','-')} type={field.type==='baseline'?(draft['trigger.metric']==='calendar-days'?'date':'number'):field.type==='money'||field.type==='number'?'number':field.type==='date'?'date':'text'} step={field.type==='money'?'0.01':field.type==='number'||field.type==='baseline'?'any':undefined} min={field.min} required={field.required} readOnly={field.readOnly} placeholder={field.placeholder} value={draft[field.key]??''} onChange={e=>setDraft(d=>({...d,[field.key]:e.target.value}))}/>
       }</label>):<p className="wide-field">Esta operação não exige informações adicionais.</p>}</div>
       {isDestructive(screen,panel)&&<p className="destructive-note">A operação pode alterar dados existentes. Haverá uma confirmação antes de executar.</p>}
       {error&&<p className="error-text" role="alert">{error}</p>}
       <div className="form-actions"><button className="secondary" type="button" disabled={busy} onClick={()=>{setPanel(null);setError('')}}>Voltar</button><button className={isDestructive(screen,panel)?'danger-button':'primary'} type="submit" disabled={busy||actionFields.some(f=>f.required&&f.type==='select'&&!(f.options?.length))}>{busy?'Salvando…':'Confirmar '+(ACTION_LABELS[panel]??panel).toLocaleLowerCase('pt-BR')}</button></div>
    </form></section></div>}
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
