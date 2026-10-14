import React,{useEffect,useState} from 'react';
import './updater.css';

export function UpdaterPanel() {
  const api=globalThis.artisys?.updates;
  const [status,setStatus]=useState(null);
  const [busy,setBusy]=useState(false);
  const [dismissed,setDismissed]=useState(false);
  useEffect(()=>{
    if(!api)return;
    let mounted=true;
    const unsub=api.onStatus(s=>{if(mounted){setStatus(s);if(['available','downloaded'].includes(s.phase))setDismissed(false);}});
    api.status().then(s=>{if(mounted)setStatus(s)}).catch(()=>{});
    return()=>{mounted=false;unsub()};
  },[]);
  if(!api || !status || dismissed || ['disabled','current','checking'].includes(status.phase))return null;
  const action=async(kind)=>{
    setBusy(true);
    try{await api[kind]()}catch{setStatus(s=>({...s,phase:'error',message:'Nao foi possivel atualizar. Seus dados nao foram alterados.'}))}finally{setBusy(false)}
  };
  const title=status.phase==='available'?`Frota ${status.availableVersion} disponível`:status.phase==='downloaded'?'Atualização pronta':status.phase==='downloading'?'Baixando atualização':status.phase==='installing'?'Instalando atualização':'Atualização';
  return <section className="frota-updater" aria-live="polite" role="status">
    <strong>{title}</strong>
    <span>{status.phase==='downloading'?`${status.percent}% concluído`:status.message}</span>
    {status.phase==='downloading' && <progress max={100} value={status.percent??0} aria-label="Download da atualização"/>}
    {status.phase==='available' && <button disabled={busy} onClick={()=>action('download')}>Baixar agora</button>}
    {status.phase==='downloaded' && <button disabled={busy} onClick={()=>action('install')}>Atualizar e reiniciar</button>}
    {status.phase==='error' && <button disabled={busy} onClick={()=>action('check')}>Tentar novamente</button>}
    {!['downloading','installing'].includes(status.phase) && <button className="frota-updater-later" onClick={()=>setDismissed(true)}>Depois</button>}
  </section>;
}
