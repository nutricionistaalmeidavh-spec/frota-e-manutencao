import {app,BrowserWindow,ipcMain} from 'electron';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createStandaloneHost} from '../runtime/host.mjs';
import {registerUpdater} from './updater.mjs';
import {createMobileAccess} from '../runtime/mobile-access.mjs';

const here=dirname(fileURLToPath(import.meta.url));
let host;
let window;
let mobileController;
app.whenReady().then(async()=>{
  host=await createStandaloneHost({dataDir:join(app.getPath('userData'),'data')});
  mobileController=createMobileAccess({dataDir:join(app.getPath('userData'),'data'),distDir:join(here,'../dist'),backend:host.backend});
  const requireDesktopSession=async(auth)=>{if(!auth?.sessionId||!auth?.token)throw Error('Entre no Windows para liberar o celular.');await host.backend.validate(auth)};
  for(const name of ['status','start','newCode','stop'])ipcMain.handle('artisys:mobile:'+name,async(_event,{auth})=>{await requireDesktopSession(auth);return mobileController[name]()});
  for(const n of ['describe','authState','bootstrap','login','validate','logout','load','action'])
    ipcMain.handle(`artisys:${n}`,(_e,p)=>host.backend[n](p));
  window=new BrowserWindow({width:1440,height:900,minWidth:1024,minHeight:680,show:false,webPreferences:{preload:join(here,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  await registerUpdater({
    app,ipcMain,getWindow:()=>window,
    prepareInstall:async()=>{
      if(!host) throw new Error('Banco de dados indisponivel');
      await mobileController?.stop();
      await host.recovery.createBackup({id:'before-update-'+Date.now()});
      await host.close();
      host=null;
    }
  });
  await window.loadFile(join(here,'../dist/index.html'));
  window.once('ready-to-show',()=>window.show());
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
app.on('before-quit',()=>{void mobileController?.stop();void host?.close?.()});
