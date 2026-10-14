import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFeedUrl, shouldEnableUpdater, UPDATE_CHECK_INTERVAL_MS} from '../electron/update-policy.mjs';

test('canal de atualizacao aceita somente HTTPS sem credenciais', () => {
  assert.equal(normalizeFeedUrl(' https://updates.example.org/frota/ '), 'https://updates.example.org/frota');
  assert.equal(normalizeFeedUrl(''), null);
  assert.throws(() => normalizeFeedUrl('http://updates.example.org/frota'), /HTTPS/);
  assert.throws(() => normalizeFeedUrl('https://token:secret@updates.example.org/frota'), /credenciais/);
  assert.throws(() => normalizeFeedUrl('https://updates.example.org/frota?token=abc'), /query/);
});

test('atualizador so inicia em aplicativo empacotado e com canal configurado', () => {
  assert.equal(shouldEnableUpdater({isPackaged: false, manifestPresent: true}), false);
  assert.equal(shouldEnableUpdater({isPackaged: true, manifestPresent: false}), false);
  assert.equal(shouldEnableUpdater({isPackaged: true, manifestPresent: true}), true);
  assert.ok(UPDATE_CHECK_INTERVAL_MS >= 6 * 60 * 60 * 1000);
});

test('versao tem build NSIS com canal opcional, nunca publica silenciosamente', async () => {
  const {readFile} = await import('node:fs/promises');
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.build.appId, 'dev.artisys.frota');
  assert.deepEqual(pkg.build.win.target, ['nsis']);
  assert.match(pkg.scripts['build:win'], /--publish\s+never/);
  assert.ok(pkg.dependencies['electron-updater'], 'electron-updater deve viajar no instalador');
});
