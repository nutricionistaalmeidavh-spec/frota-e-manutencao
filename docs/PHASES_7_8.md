# Fases 7 e 8 — ArtiSys Frota + Manutenção

## Fase 7

`ARTISYS_LEGACY_DB` é tratado como fonte somente leitura. WAL ativo bloqueia o ensaio. O gate registra SHA-256 e snapshot lógico, copia o banco para sandbox como `artisys-frota-manutencao.sqlite`, exige simultaneamente `frota/001-initial.sql` e `manutencao/001-initial.sql`, testa escrita/reabertura e backup/restore, compara as tabelas preexistentes e confirma hash inalterado do original.

Evidência: `qa-artifacts/phase7-summary.json`.

## Fase 8

F5, F7 e Playwright precisam estar `passed` no HEAD atual. O instalador `ArtiSys-Frota-Setup-*.exe` precisa ter mais de 1 MiB, ser posterior às evidências e recebe SHA-256 em `qa-artifacts/release-certification.json`.

```powershell
npm install --no-audit --no-fund
npx playwright install chromium
$env:ARTISYS_LEGACY_DB="C:\caminho\artisys-frota-manutencao.sqlite"
npm run release:certify
```

A promoção para `main` e qualquer remoção no monorepo permanecem bloqueadas até certificação final `passed`.
