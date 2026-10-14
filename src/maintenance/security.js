import {createProductSecurity} from '../../shared/core.mjs';

export const SECURITY_POLICY=Object.freeze({
  admin:['*'],
  'maintenance-manager':['maintenance:read','maintenance:write','inventory:read','inventory:write','finance:read','reports:read','audit:read','session:revoke'],
  technician:['maintenance:read','maintenance:write','inventory:read','reports:read','session:revoke'],
  viewer:['maintenance:read','reports:read','session:revoke']
});

export const createSecurityService=(persistence)=>createProductSecurity(persistence,{productId:'fleet-maintenance',policyDefinition:SECURITY_POLICY});
