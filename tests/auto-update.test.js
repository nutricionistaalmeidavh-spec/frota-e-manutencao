import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePublicReleaseChannel,shouldEnableUpdater,UPDATE_CHECK_INTERVAL_MS} from '../electron/update-policy.mjs';

test('canal publico do mesmo repositorio, sem servico pago ou token embutido',()=>{
  assert.deepEqual(resolvePublicReleaseChannel(),{provider:'github',owner:'nutricionistaalmeidavh-spec',repo:'frota-e-manutencao'});
  assert.throws(()=>resolvePublicReleaseChannel('https://github.com/owner/repo'),/owner\/repo/i);
  assert.throws(()=>resolvePublicReleaseChannel('owner/repo?token=x'),/owner\/repo/i);
});

test('updater so opera em aplicativo empacotado com manifest',()=>{
  assert.equal(shouldEnableUpdater({isPackaged:false,manifestPresent:true}),false);
  assert.equal(shouldEnableUpdater({isPackaged:true,manifestPresent:false}),false);
  assert.equal(shouldEnableUpdater({isPackaged:true,manifestPresent:true}),true);
  assert.ok(UPDATE_CHECK_INTERVAL_MS>=6*60*60*1000);
});

test('build nao publica sozinho e usa NSIS',async()=>{
  const {readFile}=await import('node:fs/promises');
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.deepEqual(pkg.build.win.target,['nsis']);
  assert.match(pkg.scripts['build:win'],/--publish\s+never/);
  assert.ok(pkg.dependencies['electron-updater']);
});
