import React,{useEffect,useState} from 'react';
import './mobile-access.css';

export function MobileAccess({auth}){
 const mobile=globalThis.artisys?.mobile;
 const [state,setState]=useState({enabled:false});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{let active=true;if(!mobile)return;mobile.status(auth).then(v=>{if(active)setState(v)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[auth]);
 if(!mobile)return null;
 async function act(name){
  if(busy)return;
  setBusy(true);setError('');
  try{setState(await mobile[name](auth))}
  catch(e){setError(e.message||'Nao foi possivel alterar o acesso movel.')}
  finally{setBusy(false)}
 }
 return <section className="mobile-access content-panel" data-testid="mobile-access">
  <div className="section-header"><div><h2>Acesso pelo celular</h2>
   <p>Compartilhe os dados deste computador com celulares conectados à mesma rede Wi-Fi.</p></div>
   <span className={'mobile-access-pill '+(state.enabled?'enabled':'')}>{state.enabled?'Ativo':'Desativado'}</span>
  </div>
  {!state.enabled?<><p>O acesso começa desligado e não publica seus dados na internet. Ative somente em uma rede confiável, com o computador ligado.</p>
    <button className="primary" type="button" disabled={busy} onClick={()=>act('start')}>Ativar acesso local seguro</button></>:
    <div className="mobile-access-details">
     <p><strong>Endereço no celular:</strong> <a href={state.url} target="_blank" rel="noreferrer">{state.url}</a></p>
     <p>Abra pelo Safari ou Chrome no mesmo Wi-Fi, confira a identidade/certificado deste computador e use o código abaixo. Depois, entre com seu usuário e senha do Frota.</p>
     <p><strong>Código de pareamento:</strong> <strong className="mobile-access-code" data-testid="mobile-pair-code">{state.pairingCode??'Expirado ou usado'}</strong></p>
     <p><small>O código é válido por cinco minutos e só pode ser usado uma vez. Ao desativar, todas as sessões móveis serão desconectadas.</small></p>
     <p><small><strong>Impressão digital do certificado SHA-256:</strong> <code className="mobile-access-fingerprint">{state.certificateFingerprint}</code>. O certificado pode precisar ser confiado manualmente no telefone; sem confiança HTTPS, a instalação como PWA não é garantida.</small></p>
     <div className="mobile-access-buttons">
      <button type="button" className="secondary" disabled={busy} onClick={()=>act('newCode')}>Gerar outro código</button>
      <button type="button" className="danger-button" disabled={busy} onClick={()=>act('stop')}>Desativar acesso</button>
     </div>
    </div>}
  {error&&<p className="error-text" role="alert">{error}</p>}
 </section>;
}
