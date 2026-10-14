const fs = require('node:fs/promises');
const path = require('node:path');

exports.default = async function pruneLocales(context) {
  if (context.electronPlatformName !== 'win32') return;
  const directory = path.join(context.appOutDir, 'locales');
  const keep = new Set(['en-US.pak', 'pt-BR.pak']);
  let files;
  try {
    files = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  let removed = 0;
  let bytes = 0;
  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith('.pak') || keep.has(file.name)) continue;
    const absolute = path.join(directory, file.name);
    bytes += (await fs.stat(absolute)).size;
    await fs.rm(absolute);
    removed++;
  }
  const left = await fs.readdir(directory);
  if (!keep.has('en-US.pak') || !left.includes('en-US.pak')) throw Error('en-US Chromium locale missing');
  console.log('Locales de Windows preservados: en-US, pt-BR; removidos ' + removed + ' arquivos (' + bytes + ' bytes) sem impacto nas funcionalidades');
};
