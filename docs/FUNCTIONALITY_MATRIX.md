# Functionality matrix — ArtiSys Frota + Manutenção

| Tela | Funcionalidades expostas |
|---|---|
| Visão Geral (`overview`) | KPIs de frota, manutenção, documentos, combustível e custos |
| Frota (`fleet`) | `save`, `remove` |
| Leituras (`readings`) | `save`; vencimentos de manutenção calculados sobre a leitura canônica |
| Abastecimentos (`fuelings`) | `create`, custo e quantidade por abastecimento |
| Pneus (`tires`) | `save`, `install`, `remove` |
| Documentos (`documents`) | `save` |
| Fornecedores (`suppliers`) | `save` |
| Viagens e Fretes (`freights`) | `create`, `dispatch`, `event`, `incident`, `tripExpense`, `complete`, `cancel` |
| Motoristas (`drivers`) | `save` no cadastro canônico `fleet.drivers` |
| Rotas (`freight-routes`) | `save` |
| Contratos (`freight-contracts`) | `save` |
| Planos preventivos (`preventive-plans`) | `create`, `save`, vencimentos dinâmicos, reinício após OS preventiva vinculada |
| Ordens de serviço (`work-orders`) | `create`, `addItem`, `authorize`, `start`, `complete`, `cancel`; custo e consumo de peça a partir da OS concluída |
| Agenda (`schedule`) | leitura/agenda de OS abertas |
| Estoque (`inventory`) | `receive`, `consume`, `reserve`, `release` |
| Checklists (`checklists`) | `save` |
| Financeiro (`finance`) | `addExpense` |
| Relatórios (`reports`) | `csv`, `issue`: custos por veículo, documentos, fretes, histórico de OS, abastecimentos/consumo e custo operacional |
| Configurações (`settings`) | `backup`, `restore` |

Total no contrato atual: **19 telas** e **37 ações de usuário**.

Viagens, fretes e despesas utilizam o **mesmo banco local**. Motoristas são `fleet.drivers` e despesas são `fleet-maintenance.finance`; não há coleções duplicadas.

## Regras canônicas P0–P2

- `fleet.vehicles` é fonte única de km/horímetro para cálculo de vencimentos; ordens concluídas vinculadas ao plano estabelecem o novo marco, sem duplicar medidores no plano.
- Ordens de serviço concluídas são a fonte imutável de custo e consumo de peças: projeções financeiras e estoque são calculadas uma vez por OS, sem lançamentos duplicados em `fleet-maintenance.finance` nem nos movimentos manuais de estoque.
- Abastecimentos usam `fleet.fuelings`; seus custos aparecem em Finanças por projeção canônica, sem lançamento financeiro duplicado.
- Motoristas (`fleet.drivers`), fornecedores (`fleet.suppliers`), pneus (`fleet.tires`) e documentos (`fleet.documents`) são os mesmos cadastros no desktop e PWA local.
- Configurações e backup/restauração exigem privilégio `settings:admin` validado pelo backend.
- Não existe serviço pago ou API externa obrigatória.
