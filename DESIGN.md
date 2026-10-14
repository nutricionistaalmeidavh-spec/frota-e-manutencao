# ArtiSys Frota + Manutenção — DESIGN

## Identidade e propósito
Ferramenta de operação diária de uma frota para responsáveis por veículos, manutenção e despesas. A experiência deve transmitir previsibilidade, capacidade técnica e controle, sem parecer uma landing page. O elemento de assinatura é o **quadro de situação da frota** na Visão Geral: dados reais de veículos e pendências, não uma métrica inventada.

## Token owner
O arquivo `web/premium.css` é a fonte normativa dos tokens visuais em execução. Este documento espelha suas decisões; `web/styles.css` conserva estilos legados e layout base enquanto a camada `premium.css` os adapta, sem incorporar dependências pagas ou remotas.

| Papel | Token | Valor |
|---|---|---|
| Texto principal | `--ink` | `#183449` |
| Título técnico | `--ink-strong` | `#0d283e` |
| Ação principal | `--brand` | `#0d7183` |
| Ação hover | `--brand-hover` | `#095c70` |
| Navegação | `--sidebar` | `#122c41` |
| Superfície | `--surface` | `#ffffff` |
| Fundo | `--page` | `#f3f6f8` |
| Borda | `--hairline` | `#dce7ec` |
| Aviso | `--warning` | `#a85b15` |
| Destrutivo | `--danger` | `#ae4246` |

## Tipografia, ícones e componentes
- Texto: **Aptos / Segoe UI / system-ui** (instalados no sistema, nunca carrega fonte remota).
- Títulos, indicadores e números tabulares: **Bahnschrift / Aptos Display / Segoe UI**.
- Ícones: `web/icons.jsx`, SVG local e acessível (decorativos marcados como tal).
- Menu: grupos Frota / Manutenção / Gestão, com um mesmo componente `nav-link` e indicação de tela corrente.
- Superfícies: raio médio 10 px; containers 16 px; bordas discretas e sombra mínima.
- Cor verde somente para sucesso real ou estado local confirmado; âmbar para pendência; vermelho para erro/destrutivo. Estados exigem rótulo além da cor.

## Densidade e responsividade
- Desktop: sidebar persistente e tabela horizontal com cabeçalho legível; painel de situação e indicadores em grupos.
- Tablet: indicadores em duas colunas e layout de painel fluido.
- Mobile (< 800 px): navegação em drawer acessível via Menu; tabela pode rolar horizontalmente sem quebrar os valores e formulários ocupam toda a largura.
- Foco teclado sempre visível. Movimento reduzido respeita `prefers-reduced-motion`.

## Não negociáveis
- Nenhuma afirmação de sincronização ou backup em nuvem: dados permanecem no dispositivo.
- Sem mascarar pendências por meio de indicadores decorativos.
- Não transformar cada tela numa coleção nova de componentes — usar os contratos em `web/action-model.mjs` e as invariantes de `UX-CONTRACT.md`.
- Software e build devem funcionar sem subscrição, SaaS, CDN ou chaves.
