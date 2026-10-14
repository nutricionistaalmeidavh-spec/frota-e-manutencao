# Atualização automática ArtiSys Frota — mesmo modelo do ArtiSys PDV

O projeto é público em https://github.com/nutricionistaalmeidavh-spec/frota-e-manutencao. O canal gratuito de atualização é a área **GitHub Releases deste próprio repositório**, sem hospedagem paga, SSH ou outro repo. O Electron NSIS embute somente owner/repo públicos no `app-update.yml`. Nenhum token vai ao desktop.

## Para o operador
O aplicativo verifica novidades ao iniciar e a cada 6 horas. Se houver versão nova, exibe "Baixar agora"; depois de baixar, "Atualizar e reiniciar". O usuário também pode escolher "Depois". Nunca força download ou reinicialização. Antes de instalar, faz backup local obrigatório e fecha o banco de forma controlada. Dados, usuários e backups permanecem em `app.getPath('userData')/data`; não ficam no diretório de instalação.

## Publicação

Um push em `release/frota-standalone-20261014` dispara o workflow **Validar e empacotar Frota independente**:
1. Resolve versão estável automaticamente: no mínimo `package.json`, um patch acima da última GitHub Release.
2. Executa testes e QA visual com Chromium.
3. Compila NSIS, verifica EXE, `latest.yml`, `*.blockmap` e SHA256.
4. Faz upload de artefatos e publica **GitHub Release** `frota-vX.Y.Z` somente após os gates verdes. Não republica release já existente para outro commit.
5. Sincroniza opcionalmente o Google Drive via `rclone` quando o secret `FROTA_GDRIVE_RCLONE_CONFIG` estiver disponível. A falta desse secret não interrompe a atualização via GitHub Releases, mas deixa o Drive sem sincronização automática.

Para a sincronização Drive no Actions, configurar apenas o secret `FROTA_GDRIVE_RCLONE_CONFIG` (credenciais de rclone da própria conta), caso desejado. A pasta está definida no arquivo de release e o pipeline mantém uma pasta de versões anteriores. Nunca expor credenciais ou `rclone.conf` no repositório ou instalador.

A versão `1.0.0-migration.8` foi produzida sem updater; clientes que ainda a utilizam precisam instalar manualmente uma versão que já traga o updater. A atualização remota começa **após uma release pública publicada e um cliente instalado com metadados embutidos**.

### Segurança operacional
- Nada executa `git pull` no computador do cliente. Git é fonte, o cliente baixa apenas instaladores publicados após QA.
- `electron-builder --publish never` impede publicação oculta. A etapa explícita de GitHub Releases publica apenas quando o pipeline aprovou.
- Não modifica schema por causa do updater, não troca os dados em userData e preserva backups.
- GitHub Releases e Google Drive estão sujeitos a políticas e limites gratuitos próprios; o core continua open source e gratuito.
