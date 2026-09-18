# ArtiSys Release — Frota + Manutenção

Este produto usa `artisys-release` + `artisys-ci-reporter` do `utilidades`, pinado em `a444031860d5b8c91adc5628759bc67c0c29d557`.

No host Windows/Woodpecker configure `ARTISYS_UTILIDADES_PATH` e `GITHUB_REPORT_TOKEN`. O workflow é `windows/amd64`, backend `local`, eventos `push`/`manual`, e apenas chama o wrapper do produto.

Ordem: `deps → test → build → installer → qa → evidence`. O banco standalone preserva os namespaces `frota` e `manutencao`; F7 continua manual com banco legado real. F8 exige F5/F7/Playwright + `release-run.json` do mesmo commit, pin e hash do instalador.

Dry-run: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\artisys-release.ps1 -DryRun`.

A ativação na UI do Woodpecker/webhook é externa; PR/fork não confiável não deve rodar no agente local.
