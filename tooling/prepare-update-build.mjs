import {readFile,writeFile} from 'node:fs/promises';
import {normalizeFeedUrl} from '../electron/update-policy.mjs';

const file = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(await readFile(file, 'utf8'));
pkg.build.compression = 'maximum';
pkg.build.afterPack = '.release/electron-afterpack.cjs';
const feed = normalizeFeedUrl(process.env.FROTA_UPDATE_FEED_URL);
if (feed) {
  pkg.build.publish = [{provider:'generic',url:feed}];
  console.log('Canal de atualizacao HTTPS configurado para este instalador.');
} else {
  delete pkg.build.publish;
  console.log('Canal publico nao configurado; instalador sem atualizacao automatica.');
}
await writeFile(file, JSON.stringify(pkg,null,2)+'\n');
