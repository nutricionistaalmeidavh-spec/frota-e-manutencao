import {app,BrowserWindow,ipcMain} from 'electron';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createStandaloneHost} from '../runtime/host.mjs';
import {registerUpdater} from './updater.mjs';

const here=dirname(fileURLToPath(import.meta.url));
let host;
let window;
app.whenReady().then(async()=>{
  host=await createStandaloneHost({dataDir:join(app.getPath('userData'),'data')});
  for(const n of ['describe','authState','bootstrap','login','validate','logout','load','action'])
    ipcMain.handle(`artisys:${n}`,(_e,p)=>host.backend[n](p));
  window=new BrowserWindow({width:1440,height:900,minWidth:1024,minHeight:680,show:false,webPreferences:{preload:join(here,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  await registerUpdater({
    app,ipcMain,getWindow:()=>window,
    prepareInstall:async()=>{
      if(!host) throw new Error('Banco de dados indisponivel');
      await host.recovery.createBackup({id:'before-update-'+Date.now()});
      await host.close();
      host=null;
    }
  });
  await window.loadFile(join(here,'../dist/index.html'));
  window.once('ready-to-show',()=>window.show());
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
app.on('before-quit',()=>void host?.close?.());
