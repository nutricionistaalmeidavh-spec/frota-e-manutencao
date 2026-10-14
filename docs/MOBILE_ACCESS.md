# Frota no celular — compartilhando o banco do Windows

## Pré-requisitos

- Windows com Frota instalado, usuário administrador criado e aplicativo aberto.
- Celular e computador conectados à **mesma rede local confiável** (Wi-Fi sem isolamento entre clientes).
- Acesso permitido pelo firewall Windows à porta TCP 8787, **somente em rede Privada**.
- Nenhuma conta em nuvem, SaaS, cloud ou serviço pago é necessário.

## Passos

1. No Frota Windows, faça login e abra **Configurações → Acesso pelo celular → Ativar acesso local seguro**.
2. No celular, abra o endereço HTTPS mostrado. Se o aparelho não confiar no certificado local, importe manualmente o certificado fornecido em \`https://IP-DO-COMPUTADOR:8787/certificate.crt\` e verifique sua impressão digital SHA-256 na tela do Windows. O procedimento exato depende do Android/iOS. **Não ignore avisos de identidade de um servidor desconhecido.**
3. Digite o código de pareamento de oito dígitos do Windows (validade de cinco minutos, uso único).
4. Entre com o mesmo usuário/senha cadastrado no Windows. No celular, adicione a página à tela inicial pelo Safari/Chrome se o navegador aceitar o certificado como confiável.
5. Para revogar sessões e parar o servidor, clique **Desativar acesso** no Windows.

## Funcionamento e limites

- **Uma base de dados SQLite**: o servidor HTTPS usa o mesmo \`runtime/host.mjs\` do desktop, sem sincronização paralela e sem cópias conflitantes.
- Usa o mesmo RBAC e sessões do desktop; não permite criar o administrador pelo celular e não inicia automaticamente.
- Pareamento usa código aleatório de oito dígitos, duração de cinco minutos, uso único e bloqueio por tentativas; o token móvel expira após oito horas e permanece somente no armazenamento da sessão do navegador.
- O desktop deve permanecer aberto e acessível pela mesma LAN. Fora da rede, o acesso não funciona por padrão. A instalação PWA exige certificado **confiável** no celular; não equivale a um app de loja.
- Não encaminhe a porta 8787 para a internet, não exponha publicamente e não utilize Wi-Fi público.
- No Windows o banco segue em \`app.getPath('userData')/data\`, com backup/recovery e preservação nas atualizações.
- HTTPS é gerado localmente com certificado próprio por instalação (open source: \`selfsigned\`); dispositivos precisam confiar nesse certificado para não receber alertas. Confira a impressão digital na tela Windows, nunca apenas a URL.
- Atualizações do EXE são geradas por GitHub Actions e GitHub Releases; o Drive só sincroniza automaticamente se o secret opcional de rclone estiver configurado.
