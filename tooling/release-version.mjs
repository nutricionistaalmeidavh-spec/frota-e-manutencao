export function nextStableReleaseVersion(packageVersion,latestTag='') {
  const parse = (v) => {
    const m=/^(\d+)\.(\d+)\.(\d+)$/.exec(String(v||''));
    if (!m) throw new Error('versao semver estavel invalida: '+v);
    return m.slice(1).map(Number);
  };
  const original = parse(packageVersion);
  if (!latestTag) return original.join('.');
  const latest = String(latestTag).match(/^frota-v(\d+\.\d+\.\d+)$/);
  if (!latest) throw new Error('versao de release invalida: '+latestTag);
  const previous=parse(latest[1]);
  for(let i=0;i<3;i++){
    if(original[i]>previous[i])return original.join('.');
    if(original[i]<previous[i])return [previous[0],previous[1],previous[2]+1].join('.');
  }
  return [previous[0],previous[1],previous[2]+1].join('.');
}
if(process.argv[1]?.endsWith('release-version.mjs')){
  console.log(nextStableReleaseVersion(process.argv[2],process.argv[3]));
}
