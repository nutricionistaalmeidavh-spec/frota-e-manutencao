# Cutover Frota + Manutenção

Este repositório só vira fonte canônica depois de `npm install`, `npm run check`, `npm run qa:web`, `npm run build:win`, homologação do instalador e abertura de um banco existente `artisys-frota-manutencao.sqlite`. O teste deve confirmar as migrations `frota/001-initial.sql` e `manutencao/001-initial.sql`, backup/restauração e jornada crítica de frota + OS preventiva. Até lá, o monorepo segue como rollback/reference.
