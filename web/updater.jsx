import React,{useEffect,useState} from 'react';
import './updater.css';

export function UpdaterPanel() {
  const api=globalThis.artisys?.updates;
  const [status,setStatus]=useState(null);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    if(!api)return;
    let mounted=true;
    const unsub=api.onStatus(s=>{if(mounted)setStatus(s)});
    api.status().then(s=>{if(mounted)setStatus(s)}).catch(()=>{});
    return()=>{mounted=false;unsub()};
  },[]);
  if(!api || !status)return null;
  const action=async(kind)=>{
    setBusy(true);
    try{await api[kind]()}catch{setStatus(s=>({...s,phase:'error',message:'Nao foi possivel executar a atualizacao. Seus dados nao foram alterados.'}))}finally{setBusy(false)}
  };
  return <section className="frota-updater" aria-live="polite">
    <span>Versão {status.version}{status.phase==='downloading'? ` · ${status.percent}%`:''}</span>
    <span>{status.message}</span>
    {status.phase==='downloaded'
      ? <button disabled={busy} onClick={()=>action('install')}>Instalar atualização</button>
      : status.phase!=='installing' && status.phase!=='downloading' && status.phase!=='available' && status.phase!=='disabled'
      ? <button disabled={busy} onClick={()=>action('check')}>Verificar</button> : null}
  </section>;
}
