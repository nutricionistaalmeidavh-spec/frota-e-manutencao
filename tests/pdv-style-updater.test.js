import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {resolvePublicReleaseChannel} from '../electron/update-policy.mjs';

test('canal publico GitHub imita PDV e nao aceita o repositorio privado',()=>{
  assert.deepEqual(resolvePublicReleaseChannel('nutricionistaalmeidavh-spec/frota-updates'),{
    provider:'github',owner:'nutricionistaalmeidavh-spec',repo:'frota-updates'
  });
  assert.equal(resolvePublicReleaseChannel(''),null);
  assert.throws(()=>resolvePublicReleaseChannel('nutricionistaalmeidavh-spec/frota-e-manutencao'),/privado/i);
  assert.throws(()=>resolvePublicReleaseChannel('https://github.com/owner/repo'),/owner\/repo/i);
  assert.throws(()=>resolvePublicReleaseChannel('owner/repo?token=x'),/owner\/repo/i);
});

test('instalador oferece download sob comando do operador e backup antes de instalar',async()=>{
  const updater=await readFile(new URL('../electron/updater.mjs',import.meta.url),'utf8');
  const preload=await readFile(new URL('../electron/preload.cjs',import.meta.url),'utf8');
  const ui=await readFile(new URL('../web/updater.jsx',import.meta.url),'utf8');
  assert.match(updater,/autoDownload\s*=\s*false/);
  assert.match(updater,/downloadUpdate\(\)/);
  assert.match(updater,/await prepareInstall\(\)/);
  assert.match(preload,/artisys:update:download/);
  assert.match(ui,/Baixar agora/);
  assert.match(ui,/Atualizar e reiniciar/);
});

test('fluxo PDV publica GitHub Release so apos sincronizacao verificada com Drive',async()=>{
  const flow=await readFile(new URL('../.github/workflows/entrega-frota-standalone.yml',import.meta.url),'utf8');
  const sync=flow.indexOf('Sincronizar instalador com Google Drive');
  const publish=flow.indexOf('Publicar GitHub Release para atualizacoes');
  assert.ok(sync>0 && publish>sync);
  assert.match(flow,/rclone check/);
  assert.match(flow,/FROTA_PUBLIC_RELEASE_TOKEN/);
  assert.match(flow,/FROTA_GDRIVE_RCLONE_CONFIG/);
  assert.match(flow,/FROTA_PUBLIC_RELEASE_REPO/);
  assert.doesNotMatch(flow,/FROTA_SSH_/);
});
