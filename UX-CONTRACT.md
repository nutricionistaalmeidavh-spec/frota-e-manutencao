# UX-CONTRACT — ArtiSys Frota

## Propriedade canônica
| Capacidade | Dono | Fonte de verdade | Verificação |
|---|---|---|---|
| Identidade de veículo / OS / plano | `src/presentation.js` + repositórios do domínio | Banco local `fleet-maintenance` | `tests/data-integrity.test.js` |
| Ações, campos e estados do formulário | `web/action-model.mjs` | RPC `runtime/backend.mjs` | `tests/e2e/frota.spec.mjs` |
| Tabela/detalhes | `web/main.jsx` (ainda não há datatable compartilhado separado) | `load({screenId})` | Playwright |
| Datas e seleção | elementos nativos `input[type=date]` e `select` | entrada localizada pt-BR / ISO para armazenamento | Playwright |
| Avisos de confirmação/erro | `web/main.jsx` | resultado assíncrono real do backend | Playwright |
| Tokens visuais | `web/premium.css` | `DESIGN.md` (espelho) | capturas Playwright |
| Backup em navegador | `shared/persistence-browser.mjs` | IndexedDB `backups` + `entries` | E2E backup + reload |

## Comportamento
- Criar/editar: só confirma depois de a gravação concluir e a lista ser relida. Ação pendente bloqueia repetição; erros não apagam o formulário.
- Seleção de linha: `Ver detalhes` exibe ações contextualizadas pelo estado do objeto, sem mudar dados por si.
- Ordens: respeitar máquina de estados de `shared/domain-maintenance.mjs` — `draft → authorized → in-progress → completed`; cancelamento é ação distinta.
- Destrutivo: pede confirmação; modal mantém conteúdo quando cancelada, exige confirmação de descarte de mudanças.
- Conflito de versão: não sobrescrever gravação mais recente; informar ao usuário que deve atualizar os registros.
- Pesquisa: afeta somente a lista visível atual, nunca altera o banco; limpar busca restaura todos os registros.
- CSV: sempre calculado dos registros locais canônicos, não recebe linhas para exportar do frontend.
- Backup: criado na base local, recuperável após atualizar o navegador, porém **não equivale a backup fora do dispositivo**.
- Navegação mobile: abre menu e fecha após escolher destino; Escape fecha modal de edição sujeito à proteção de descarte.
- Focus: o título de tela recebe foco programático após navegação; controles de ação mostram `focus-visible`.

## Revisão de aceitação
1. `npm run check` (contratos + dados + compilação React).
2. `npm run qa:surface` (11 telas / 21 ações).
3. `npm run qa:web` (registro, leitura, backup após reload, mobile, screenshots).
4. `npm run build:win` antes de entregar um instalador.
5. Homologação com banco legado permanece separada e condicionada ao arquivo real de origem. QA de UI não substitui certificação de migração.
