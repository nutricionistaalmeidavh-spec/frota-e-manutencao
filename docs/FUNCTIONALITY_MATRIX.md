# Functionality matrix — ArtiSys Frota + Manutenção

| Tela | Funcionalidades expostas |
|---|---|
| Visão Geral (`overview`) | KPIs de frota, manutenção, documentos, combustível e custos |
| Frota (`fleet`) | `save`, `remove` |
| Leituras (`readings`) | `save` |
| Viagens e Fretes (`freights`) | `create`, `dispatch`, `event`, `incident`, `tripExpense`, `complete`, `cancel` |
| Motoristas (`drivers`) | `save` no cadastro canônico `fleet.drivers` |
| Rotas (`freight-routes`) | `save` |
| Contratos (`freight-contracts`) | `save` |
| Planos preventivos (`preventive-plans`) | `create`, `save` |
| Ordens de serviço (`work-orders`) | `create`, `addItem`, `authorize`, `start`, `complete`, `cancel` |
| Agenda (`schedule`) | leitura/agenda de OS abertas |
| Estoque (`inventory`) | `receive`, `consume`, `reserve`, `release` |
| Checklists (`checklists`) | `save` |
| Financeiro (`finance`) | `addExpense` |
| Relatórios (`reports`) | `csv`, `issue` |
| Configurações (`settings`) | `backup`, `restore` |

Total no contrato atual: **15 telas** e **31 ações de usuário**.

Viagens, fretes e despesas utilizam o **mesmo banco local**. Motoristas são `fleet.drivers` e despesas são `fleet-maintenance.finance`; não há coleções duplicadas.
