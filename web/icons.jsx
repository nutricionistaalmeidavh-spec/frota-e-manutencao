import React from 'react';

const paths={
 overview:<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
 fleet:<><path d="M3 16V10l2-5h14l2 5v6"/><path d="M3 16h18M5 10h14M6 16v3h3v-3m6 0v3h3v-3"/><circle cx="7.5" cy="13.5" r=".6" fill="currentColor" stroke="none"/><circle cx="16.5" cy="13.5" r=".6" fill="currentColor" stroke="none"/></>,
 readings:<><circle cx="12" cy="12" r="9"/><path d="M5.7 15.9a7 7 0 0 1 12.6 0M12 12l4-4M9 19h6"/></>,
 'preventive-plans':<><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-12 5 2.5 2.5L16 13"/></>,
 'work-orders':<><path d="M8 5H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/><path d="m14 3 7 7-9 9-4 1 1-4 9-9"/></>,
 schedule:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h3m3 0h3m-9 4h3"/></>,
 inventory:<><path d="m12 2 9 5-9 5-9-5 9-5ZM3 7v10l9 5 9-5V7M12 12v10"/></>,
 checklists:<><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4.5V3h6v1.5M8 10l1.5 1.5 2-2M13 11h3M8 16l1.5 1.5 2-2M13 17h3"/></>,
 finance:<><rect x="2.5" y="6" width="19" height="14" rx="2"/><path d="M2.5 10h19M7 15h3M16 4v2"/></>,
 reports:<><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h4M8 17v-4m4 4v-6m4 6v-3"/></>,
 settings:<><circle cx="12" cy="12" r="3"/><path d="M19.2 15.2 21 16l-2 3.5-2-.9a9 9 0 0 1-2 1.1L14.7 22h-4l-.3-2.3a9 9 0 0 1-2-1.1l-2 .9L4.5 16l1.8-.8a8 8 0 0 1 0-2.4l-1.8-.8 2-3.5 2 .9a9 9 0 0 1 2-1.1L10.7 6h4l.3 2.3a9 9 0 0 1 2 1.1l2-.9L21 12l-1.8.8a8 8 0 0 1 0 2.4Z"/></>,
 search:<><circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/></>,
 chevron:<path d="m9 18 6-6-6-6"/>,
 arrow:<path d="M4 12h16m-7-7 7 7-7 7"/>,
 close:<path d="M5 5l14 14M19 5 5 19"/>,
 plus:<path d="M12 4v16M4 12h16"/>,
 alert:<><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3h.01"/></>,
 check:<path d="m5 12 4 4L19 6"/>,
 truck:<><path d="M2 6h12v12H2zM14 10h4l3 3v5h-7"/><circle cx="6" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></>,
 shield:<><path d="M12 2 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z"/><path d="m8 12 3 3 5-6"/></>,
 download:<><path d="M12 2v14m-5-5 5 5 5-5M4 19v3h16v-3"/></>
};
export function Icon({name,size=18,className='',title,...rest}){
 return <svg aria-hidden={title?undefined:true} role={title?'img':undefined} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>{title&&<title>{title}</title>}{paths[name]??paths.overview}</svg>;
}
