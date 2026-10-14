import {readFile,writeFile} from 'node:fs/promises';
import {resolvePublicReleaseChannel} from '../electron/update-policy.mjs';

const file = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(await readFile(file, 'utf8'));
pkg.build.compression = 'maximum';
pkg.build.afterPack = '.release/electron-afterpack.cjs';
const github = resolvePublicReleaseChannel(process.env.FROTA_PUBLIC_RELEASE_REPO);
if (github) {
  pkg.build.publish = [github];
  console.log('Canal de atualizacao por GitHub Releases configurado (sem token no instalador): '+github.owner+'/'+github.repo);
} else {
  pkg.build.publish = null;
  console.log('Repositorio publico de releases nao configurado: build offline sem updater remoto. Nenhuma dependencia paga ou servidor SSH.');
}
await writeFile(file, JSON.stringify(pkg,null,2)+'\n');
