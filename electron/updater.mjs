import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {shouldEnableUpdater,UPDATE_CHECK_INTERVAL_MS} from './update-policy.mjs';

export async function registerUpdater({app,ipcMain,getWindow,prepareInstall}) {
  let state = {phase:'disabled',version:app.getVersion(),message:'Atualizacoes remotas ainda nao configuradas neste instalador.'};
  let updater = null;
  let checking = null;
  let downloading = null;
  const emit = (patch) => {
    state = {...state,...patch};
    const w = getWindow();
    if (w && !w.isDestroyed()) w.webContents.send('artisys:update:status',state);
    return state;
  };
  const check = async () => {
    if (!updater) return state;
    if (checking) return checking;
    if (['downloading','downloaded','installing'].includes(state.phase)) return state;
    checking = (async () => {
      emit({phase:'checking',message:'Verificando nova versao...'});
      try { await updater.checkForUpdates(); }
      catch { emit({phase:'error',message:'Nao foi possivel verificar a atualizacao. Seus dados estao preservados.'}); }
      return state;
    })();
    try { return await checking; }
    finally { checking = null; }
  };
  const download = async () => {
    if (!updater || !['available','downloading'].includes(state.phase))
      throw new Error('Nenhuma atualizacao disponivel para baixar.');
    if (downloading) return downloading;
    emit({phase:'downloading',percent:0,message:'Baixando atualizacao...'});
    downloading = updater.downloadUpdate().catch(error => {
      emit({phase:'error',message:'Falha no download. O aplicativo continua funcionando normalmente.'});
      throw error;
    }).finally(()=>{downloading=null;});
    return downloading;
  };
  ipcMain.handle('artisys:update:status',() => state);
  ipcMain.handle('artisys:update:check',() => check());
  ipcMain.handle('artisys:update:download',() => download());
  ipcMain.handle('artisys:update:install',async () => {
    if (!updater || state.phase !== 'downloaded') throw new Error('Nenhuma atualizacao pronta para instalar.');
    emit({phase:'installing',message:'Criando backup local antes de atualizar...'});
    try {
      await prepareInstall();
      updater.quitAndInstall(false,true);
      return state;
    } catch {
      emit({phase:'error',message:'Falha ao criar backup ou encerrar o banco. Instalacao cancelada.'});
      throw new Error('Instalacao cancelada: backup nao concluido.');
    }
  });
  const manifest = join(process.resourcesPath,'app-update.yml');
  if (!shouldEnableUpdater({isPackaged:app.isPackaged,manifestPresent:existsSync(manifest)})) return;
  try {
    const module = await import('electron-updater');
    updater = (module.default ?? module).autoUpdater;
  } catch {
    emit({phase:'error',message:'Atualizacoes indisponiveis neste computador; aplicativo preservado.'});
    return;
  }
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = false;
  updater.allowPrerelease = false;
  updater.on('checking-for-update',() => emit({phase:'checking',message:'Verificando nova versao...'}));
  updater.on('update-not-available',() => emit({phase:'current',availableVersion:null,message:'Versao atualizada.'}));
  updater.on('update-available',info => emit({phase:'available',availableVersion:info.version,message:'Nova versao disponivel. Deseja baixar agora?'}));
  updater.on('download-progress',p => emit({phase:'downloading',percent:Math.min(100,Math.max(0,Math.round(p.percent || 0))),message:'Baixando atualizacao...'}));
  updater.on('update-downloaded',info => emit({phase:'downloaded',availableVersion:info.version,percent:100,message:'Atualizacao pronta. Ao instalar, um backup local sera criado.'}));
  updater.on('error',() => emit({phase:'error',message:'Nao foi possivel atualizar agora. Seus dados e sua versao atual permanecem intactos.'}));
  emit({phase:'current',message:'Canal de atualizacoes GitHub Releases habilitado.'});
  setTimeout(()=>{void check();},8000).unref?.();
  setInterval(()=>{void check();},UPDATE_CHECK_INTERVAL_MS).unref?.();
}
