# Preparação da entrega do ArtiSys Frota (branch independente)

Produto em `frota-e-manutencao` na branch `integration/agrofrota-artisys-release`.

Workflow somente na branch de entrega; nenhuma alteração na `main`.

O QA do aplicativo existente valida importações, suíte unitária, cobertura de telas e Playwright. A certificação Fase 7 da migração de banco legado exige o arquivo original e não pode ser declarada concluída sem ele. A execução não promove para `main`.

O instalador é produzido como arquivo único pela configuração Electron/NSIS do próprio repositório, com SHA-256 e manifesto.
