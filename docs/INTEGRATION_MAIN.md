# Integração com ArtiSys Agro
Esta integração preserva as funções públicas de `src/agro-adapter.js` e o contrato v1 de `src/agro-contract-v1.js`. Os testes de `tests/agro-adapter.test.js` seguem na suíte de `npm test`.
O adaptador constrói eventos locais, sem exigir SaaS, token ou API paga. **Não equivale a enviar eventos automaticamente**: o transporte local/LAN depende de configuração explícita na integração Agro Bridge.
O domínio do aplicativo opera com `assetId`; o contrato externo aceita `machineId` no payload de chamada do adaptador. A conversão deve ocorrer numa fronteira explícita, nunca mediante identificação implícita de entidades.
