import {readFile,writeFile} from 'node:fs/promises';
import {resolvePublicReleaseChannel} from '../electron/update-policy.mjs';

const file = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(await readFile(file,'utf8'));
pkg.build.compression = 'maximum';
pkg.build.afterPack = '.release/electron-afterpack.cjs';
pkg.build.publish = [resolvePublicReleaseChannel()];
await writeFile(file,JSON.stringify(pkg,null,2)+'\n');
console.log('Updater configurado para GitHub Releases publicas do repositorio Frota (sem secrets no cliente).');
