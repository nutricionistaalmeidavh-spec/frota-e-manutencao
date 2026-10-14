# Atualizacoes do ArtiSys Frota (Windows)

O codigo-fonte permanece no repositorio **privado**. O instalador usa Electron/NSIS e `electron-updater` (open source). Nao inclua token do GitHub ou credenciais de armazenamento no aplicativo. O banco continua em `app.getPath('userData')/data`, e o updater cria backup local **antes** de encerrar para instalar.

## Configuracao do canal

1. Disponibilize um diretorio **HTTPS** estatico acessivel pelos clientes (servidor proprio com Caddy/Nginx, ou espelhamento gratuito de binarios em repositorio publico separado). Os arquivos nao devem requerer autenticar cliente.
2. Na configuracao **Variables** do repositorio GitHub, crie `FROTA_UPDATE_FEED_URL` contendo a URL publica do diretorio, sem token e sem query. E opcional: sem ela, o instalador funciona normalmente mas **nao** verifica atualizacoes.
3. Gere um build a partir da branch `release/frota-standalone-20261014`. O Actions valida QA, instala dependencias, executa Playwright e cria EXE, blockmap e latest.yml.
4. Publique no mesmo diretorio **o exe, o .blockmap e o latest.yml desse unico build**. Para evitar cliente baixar arquivo incompleto, envie EXE e blockmap primeiro; publique `latest.yml` por ultimo/atomicamente. Pode ser feito por CI via SSH em servidor proprio. Nao misture metadados de builds distintos.
5. Confirme a URL `.../latest.yml` e os downloads dos arquivos, instale esta versao para habilitar atualizacoes futuras, e entao publique uma versao numericamente maior. Atualizacoes sao verificadas ao iniciar e a cada 6 horas, baixadas automaticamente; o usuario confirma a instalacao. O aplicativo nao instala se o backup falhar.

**Importante:** a versao anterior `1.0.0-migration.8` nao inclui o updater: quem ja a instalou precisa instalar **uma vez** o novo setup para receber atualizacoes futuras.

## Controle de publicacao

- O workflow **nao** publica builds em servidores externos sem configuracao explicita.
- `--publish never` impede publicacao implicita por electron-builder.
- Build e artefatos do Actions nao sao o mesmo que um canal de atualizacao permanente.
- GitHub Releases **privadas** podem servir para distribuicao interna, mas nao sao um feed publico para clientes nao autenticados.
- Para uma publicacao de clientes, mantenha `latest.yml` e instaladores em armazenamento com historico/retencao e HTTPS. Cloudflare R2 e outros servicos sao **opcionais** (limites de gratuidade se aplicam); nenhum e obrigatorio no core.
