import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {shouldEnableUpdater,UPDATE_CHECK_INTERVAL_MS} from './update-policy.mjs';

export async function registerUpdater({app,ipcMain,getWindow,prepareInstall}) {
  let state = {phase:'disabled',version:app.getVersion(),message:'Canal de atualizacao nao configurado neste instalador.'};
  let updater = null;
  let checking = null;
  const emit = (patch) => {
    state = {...state,...patch};
    const w = getWindow();
    if (w && !w.isDestroyed()) w.webContents.send('artisys:update:status',state);
    return state;
  };
  const check = async () => {
    if (!updater) return state;
    if (checking) return checking;
    checking = (async () => {
      emit({phase:'checking',message:'Verificando atualizacoes...'});
      try { await updater.checkForUpdates(); }
      catch (error) { emit({phase:'error',message:'Falha ao verificar atualizacoes. Tente novamente mais tarde.'}); }
      return state;
    })();
    try { return await checking; }
    finally { checking = null; }
  };

  ipcMain.handle('artisys:update:status',() => state);
  ipcMain.handle('artisys:update:check',() => check());
  ipcMain.handle('artisys:update:install',async () => {
    if (!updater || state.phase !== 'downloaded') throw new Error('Nenhuma atualizacao pronta para instalar.');
    emit({phase:'installing',message:'Criando backup e preparando instalacao...'});
    try {
      await prepareInstall();
      updater.quitAndInstall(false,true);
      return state;
    } catch (error) {
      emit({phase:'error',message:'Nao foi possivel criar o backup ou finalizar o aplicativo. A instalacao foi cancelada.'});
      throw error;
    }
  });

  const manifest = join(process.resourcesPath,'app-update.yml');
  if (!shouldEnableUpdater({isPackaged:app.isPackaged,manifestPresent:existsSync(manifest)})) return;
  try {
    const module = await import('electron-updater');
    updater = (module.default ?? module).autoUpdater;
  } catch {
    emit({phase:'error',message:'Atualizacoes indisponiveis nesta instalacao. O aplicativo continuara funcionando.'});
    return;
  }
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = false;
  updater.allowPrerelease = false;
  updater.on('checking-for-update',() => emit({phase:'checking',message:'Verificando atualizacoes...'}));
  updater.on('update-not-available',() => emit({phase:'current',message:'Versao atualizada.'}));
  updater.on('update-available',info => emit({phase:'available',availableVersion:info.version,message:'Nova versao encontrada. Baixando automaticamente...'}));
  updater.on('download-progress',p => emit({phase:'downloading',percent:Math.round(p.percent || 0),message:'Baixando atualizacao...'}));
  updater.on('update-downloaded',info => emit({phase:'downloaded',availableVersion:info.version,percent:100,message:'Atualizacao pronta. Confirme para instalar; um backup local sera criado.'}));
  updater.on('error',() => emit({phase:'error',message:'O canal de atualizacao nao respondeu. Seus dados e sua versao atual permanecem intactos.'}));
  emit({phase:'current',message:'Atualizacoes automaticas habilitadas.'});
  setTimeout(() => { void check(); }, 8000).unref?.();
  setInterval(() => { void check(); },UPDATE_CHECK_INTERVAL_MS).unref?.();
}
