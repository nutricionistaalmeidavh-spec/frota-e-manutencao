# Migração standalone — Fases 5 e 6

## Fase 5 — Homologação de robustez independente

`npm run phase5` valida a fronteira standalone, testes Node, build web, autenticação, as 11 telas e 21 ações do contrato, RBAC, backup/restauração, reabertura do SQLite e navegação completa pelo Playwright.

O produto mantém Frota e Manutenção no mesmo `productId` e no mesmo banco, mas preserva namespaces separados de migration.

## Fase 6 — Compatibilidade e cutover técnico

`npm run compat:contract` exige:

- `productId`: `fleet-maintenance`;
- banco: `artisys-frota-manutencao.sqlite`;
- migration `frota/001-initial.sql`;
- migration `manutencao/001-initial.sql`;
- os dois contratos de persistência apontando para o mesmo banco.

Teste com banco real anterior:

```powershell
$env:ARTISYS_LEGACY_DB="C:\caminho\artisys-frota-manutencao.sqlite"; npm run compat:legacy
```

A validação usa uma cópia sandbox do banco. `npm run cutover:verify` combina Fase 5, compatibilidade legada e build NSIS. O monorepo permanece rollback/reference até homologação real.
