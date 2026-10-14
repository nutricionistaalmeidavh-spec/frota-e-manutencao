import {createProductDocumentService} from '../../shared/core.mjs';

export const DOCUMENT_DEFINITIONS=Object.freeze({
  'maintenance-history':Object.freeze({title:'Histórico de manutenção',columns:Object.freeze(['workOrderId','assetId','type','status','completedAt','costMinor'])}),
  'maintenance-due':Object.freeze({title:'Manutenções previstas',columns:Object.freeze(['assetId','planId','metric','dueAt','remaining'])})
});

export const createDocumentService=(persistence=null)=>createProductDocumentService({productId:'fleet-maintenance',definitions:DOCUMENT_DEFINITIONS,persistence});
