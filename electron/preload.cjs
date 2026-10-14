const {contextBridge,ipcRenderer}=require('electron');
const names=['describe','authState','bootstrap','login','validate','logout','load','action'];
const backend=Object.fromEntries(names.map(n=>[n,p=>ipcRenderer.invoke(`artisys:${n}`,p)]));
const updates=Object.freeze({
  status:()=>ipcRenderer.invoke('artisys:update:status'),
  check:()=>ipcRenderer.invoke('artisys:update:check'),
  download:()=>ipcRenderer.invoke('artisys:update:download'),
  install:()=>ipcRenderer.invoke('artisys:update:install'),
  onStatus:(callback)=>{
    if(typeof callback!=='function') throw new TypeError('callback obrigatorio');
    const handler=(_event,status)=>callback(status);
    ipcRenderer.on('artisys:update:status',handler);
    return ()=>ipcRenderer.removeListener('artisys:update:status',handler);
  }
});
contextBridge.exposeInMainWorld('artisys',Object.freeze({...backend,updates}));
