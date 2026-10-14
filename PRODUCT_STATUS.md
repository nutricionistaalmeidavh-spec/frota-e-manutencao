# ArtiSys Frota + Manutenção — Status do Produto

- Produto: `fleet-maintenance`
- Banco único: `artisys-frota-manutencao.sqlite`
- Migrations obrigatórias: `frota/001-initial.sql` + `manutencao/001-initial.sql`
- Telas contratadas: **11**
- Ações contratadas: **21**
- Dependência paga obrigatória: **nenhuma**

## Fases 5–6

Implementadas em código; homologação depende de execução fresca.

## Fase 7

`npm run phase7` abre somente uma cópia sandbox do banco legado, exige os dois namespaces de migration, testa escrita/reabertura e backup/restore e prova que tabelas preexistentes e SHA-256 do original permanecem intactos. WAL ativo bloqueia o ensaio.

## Fase 8

`npm run phase8:certify` exige evidências `passed` de F5/F7/Playwright no mesmo commit e instalador `ArtiSys-Frota-Setup-*.exe` atual, maior que 1 MiB, com SHA-256 registrado.

```powershell
$env:ARTISYS_LEGACY_DB="C:\caminho\artisys-frota-manutencao.sqlite"; npm run release:certify
```

**Estado:** Fases 0–8 implementadas; homologação e promoção para `main` permanecem bloqueadas até certificação real `passed`. O monorepo continua rollback/reference.
