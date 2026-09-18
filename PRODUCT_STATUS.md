# ArtiSys Frota + Manutenção — Status do Produto

- Produto: `fleet-maintenance`
- Banco: `artisys-frota-manutencao.sqlite`
- Namespaces: `frota` + `manutencao`
- Telas contratadas: **11**
- Ações contratadas: **21**
- Dependência paga obrigatória: **nenhuma**

## Fase 5

Implementada; homologação depende de execução fresca de `npm run phase5`.

## Fase 6

Implementada; o cutover depende de banco legado real e build Windows:

```powershell
$env:ARTISYS_LEGACY_DB="C:\caminho\artisys-frota-manutencao.sqlite"; npm run cutover:verify
```

Até o gate verde, o monorepo permanece rollback/reference.
