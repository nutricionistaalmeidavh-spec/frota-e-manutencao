# ArtiSys Frota + Manutenção — Status do Produto

- Produto: `fleet-maintenance`
- Banco único: `artisys-frota-manutencao.sqlite`
- Migrations obrigatórias: `frota/001-initial.sql` + `manutencao/001-initial.sql`
- Telas contratadas: **19**
- Ações contratadas: **37**
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

## Evolução P0–P2 (PR #7)

- Novos cadastros: Viagens/Fretes, Motoristas, Rotas, Contratos, Abastecimentos, Pneus, Documentos e Fornecedores.
- P0: cálculo de vencimentos pelos medidores canônicos do veículo e pela última OS preventiva concluída; restrição administrativa de Configurações.
- P1: custos de OS, baixa de peças e combustível projetados exclusivamente de fatos operacionais persistidos, evitando lançamentos duplicados e preservando backup/recovery. Nova integração não altera estrutura SQL dos dados anteriores.
- P2: relatório de custos operacionais, histórico de manutenção, abastecimentos/consumo e margem de fretes.
- A release deve ser publicada somente após QA de `main` aprovado; certificação de migração de banco legado exige arquivo legado real e continua procedimento separado.
