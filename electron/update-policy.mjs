export const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const PUBLIC_RELEASE_REPOSITORY = 'nutricionistaalmeidavh-spec/frota-e-manutencao';

export function resolvePublicReleaseChannel(value = PUBLIC_RELEASE_REPOSITORY) {
  const input = String(value ?? '').trim();
  if (!/^[A-Za-z\d](?:[A-Za-z\d-]{0,38})\/[A-Za-z\d_.-]+$/.test(input))
    throw new Error('Informe o repositorio publico como owner/repo, sem URL, token ou query.');
  const [owner,repo] = input.split('/');
  return {provider:'github',owner,repo,tagNamePrefix:'frota-v'};
}

export function shouldEnableUpdater({isPackaged, manifestPresent}) {
  return Boolean(isPackaged && manifestPresent);
}
