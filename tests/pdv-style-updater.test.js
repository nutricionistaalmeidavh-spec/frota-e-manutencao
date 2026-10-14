import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolvePublicReleaseChannel} from '../electron/update-policy.mjs';
import {nextStableReleaseVersion} from '../tooling/release-version.mjs';

test('canal utiliza o proprio repositorio publico da Frota',()=>{
  assert.deepEqual(resolvePublicReleaseChannel(),{
    provider:'github',owner:'nutricionistaalmeidavh-spec',repo:'frota-e-manutencao'
  });
  assert.throws(()=>resolvePublicReleaseChannel('https://github.com/owner/repo'),/owner\/repo/i);
  assert.throws(()=>resolvePublicReleaseChannel('owner/repo?token=x'),/owner\/repo/i);
});

test('versoes sobem automaticamente, nao reusam tags anteriores',()=>{
  assert.equal(nextStableReleaseVersion('1.0.2',''), '1.0.2');
  assert.equal(nextStableReleaseVersion('1.0.2','frota-v1.0.2'), '1.0.3');
  assert.equal(nextStableReleaseVersion('1.0.2','frota-v1.0.5'), '1.0.6');
  assert.equal(nextStableReleaseVersion('1.1.0','frota-v1.0.5'), '1.1.0');
  assert.throws(()=>nextStableReleaseVersion('1.0.2','frota-vx.y.z'),/versao/i);
});

test('updater do desktop replica confirmacao de download e de instalacao do PDV',async()=>{
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

test('workflow usa GitHub Release, valida metadados e mantem Drive opcional',async()=>{
  const flow=await readFile(new URL('../.github/workflows/entrega-frota-standalone.yml',import.meta.url),'utf8');
  assert.match(flow,/Publicar GitHub Release para o updater/);
  assert.match(flow,/latest\.yml/);
  assert.match(flow,/\.blockmap/);
  assert.match(flow,/FROTA_GDRIVE_RCLONE_CONFIG/);
  assert.match(flow,/rclone check/);
  assert.doesNotMatch(flow,/FROTA_SSH_/);
  assert.doesNotMatch(flow,/FROTA_PUBLIC_RELEASE_TOKEN/);
});

test('primeira release nao falha por consultar tag inexistente',async()=>{
  const flow=await readFile(new URL('../.github/workflows/entrega-frota-standalone.yml',import.meta.url),'utf8');
  assert.match(flow,/gh api .*releases\?per_page=100/);
  assert.match(flow,/any\(\.\[\]; \.tag_name == \$tag\)/);
  assert.doesNotMatch(flow,/gh release view \$env:RELEASE_TAG/);
});
