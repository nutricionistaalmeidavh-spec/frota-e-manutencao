# Shared core boundary — Frota + Manutenção

A extração deste produto não poderá manter imports por caminho para `SistemasNichadosAgroFrota` nem copiar regras de negócio de outros produtos.

Core compartilhado identificado para a futura extração:

- `ui-shell`
- `vertical-persistence`
- `domain-maintenance`
- `product-inventory`
- `product-documents`
- `product-security`
- módulos obrigatórios listados em `DEPENDENCY_INVENTORY.md`

O padrão validado primeiro em `SistemaLavoura` será reutilizado: produto em `src/`, core técnico/domínio separado e versionado/pinado, proveniência explícita e nenhum serviço pago obrigatório.
