export const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function normalizeFeedUrl(value) {
  if (value == null || String(value).trim() === '') return null;
  let parsed;
  try { parsed = new URL(String(value).trim()); }
  catch { throw new Error('URL do canal de atualizacao invalida.'); }
  if (parsed.protocol !== 'https:') throw new Error('O canal de atualizacao deve usar HTTPS.');
  if (parsed.username || parsed.password) throw new Error('Nao incluir credenciais na URL do canal.');
  if (parsed.search) throw new Error('Nao incluir query/token na URL do canal.');
  if (parsed.hash) throw new Error('Nao incluir fragmento na URL do canal.');
  return parsed.toString().replace(/\/$/, '');
}

export function shouldEnableUpdater({isPackaged, manifestPresent}) {
  return Boolean(isPackaged && manifestPresent);
}
