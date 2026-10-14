# ArtiSys Frota + Manutenção — Fases 7 e 8

## Objetivo

Fechar a migração standalone com ensaio de cutover seguro do banco legado combinado e certificação do release apenas com evidências frescas do mesmo commit.

## Fase 7 — Ensaio de cutover

Entrada obrigatória: `ARTISYS_LEGACY_DB` apontando para `artisys-frota-manutencao.sqlite`.

O ensaio deve: calcular SHA-256 do arquivo original; copiar para sandbox; capturar snapshot lógico das tabelas antigas; abrir a cópia por `createStandaloneHost`; validar `productId=fleet-maintenance`; exigir simultaneamente `frota/001-initial.sql` e `manutencao/001-initial.sql`; criar backup; gravar sentinel em `qa.cutover`; fechar/reabrir e conferir persistência; restaurar o backup; confirmar preservação dos dados anteriores; provar que o hash do original permaneceu idêntico; gravar `qa-artifacts/phase7-summary.json` com commit, namespaces e resultado.

O arquivo legado original nunca recebe escrita.

## Fase 8 — Certificação

A certificação exige no mesmo commit:
- `phase5-summary.json` passado;
- `phase7-summary.json` passado;
- `playwright-summary.json` passado;
- `npm run check` verde;
- instalador `release/ArtiSys-Frota-Setup-*.exe` maior que 1 MiB;
- SHA-256 do instalador gravado em `qa-artifacts/release-certification.json`.

Ordem: F5 → F7 → Playwright → check → build Windows → certificador.

## Contrato funcional

Telas: `overview`, `fleet`, `readings`, `preventive-plans`, `work-orders`, `schedule`, `inventory`, `checklists`, `finance`, `reports`, `settings`.

Ações: `fleet/save`, `fleet/remove`, `readings/save`, `preventive-plans/create`, `preventive-plans/save`, `work-orders/create`, `work-orders/addItem`, `work-orders/authorize`, `work-orders/start`, `work-orders/complete`, `work-orders/cancel`, `inventory/receive`, `inventory/consume`, `inventory/reserve`, `inventory/release`, `checklists/save`, `finance/addExpense`, `reports/csv`, `reports/issue`, `settings/backup`, `settings/restore`.

## Restrições

`productId=fleet-maintenance`; banco único `artisys-frota-manutencao.sqlite`; namespaces `frota` e `manutencao`; core obrigatório R$0/self-hosted/open source; monorepo preservado como rollback; nenhum merge automático para `main`.