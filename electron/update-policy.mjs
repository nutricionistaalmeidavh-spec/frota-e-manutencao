export const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const PRIVATE_SOURCE_REPOSITORY = 'nutricionistaalmeidavh-spec/frota-e-manutencao';

export function resolvePublicReleaseChannel(value) {
  const input = String(value ?? '').trim();
  if (!input) return null;
  if (!/^[A-Za-z\d](?:[A-Za-z\d-]{0,38})\/[A-Za-z\d_.-]+$/.test(input))
    throw new Error('Informe o repositorio publico como owner/repo, sem URL, token ou query.');
  if (input.toLowerCase() === PRIVATE_SOURCE_REPOSITORY.toLowerCase())
    throw new Error('Repositorio privado nao funciona como canal de atualizacao de clientes.');
  const [owner,repo] = input.split('/');
  return {provider:'github',owner,repo};
}

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
