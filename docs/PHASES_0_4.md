# Migração standalone — Fases 0–4

- F0: baseline e contratos congelados em `a95bd0176ad4053276c5588d3170d18fe5c24c8e`.
- F1: fronteiras e política obrigatória R$0/self-hosted/open source.
- F2: Frota e Manutenção passam a compartilhar neste repositório o mesmo banco `artisys-frota-manutencao.sqlite`, preservando namespaces `frota` e `manutencao`.
- F3: runtime SQLite, backup/restauração, UI própria, Electron, testes e Playwright independentes.
- F4: instalador NSIS x64, gate Woodpecker e checklist de cutover.

Nenhum corte destrutivo é feito no monorepo antes da homologação.
