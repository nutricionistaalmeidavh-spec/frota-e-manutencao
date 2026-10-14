# ArtiSys Frota + Manutenção Fases 7 e 8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar cutover não destrutivo de `artisys-frota-manutencao.sqlite` e certificação fail-closed do release combinado Frota + Manutenção.

**Architecture:** F7 valida os dois namespaces de migration sobre uma cópia sandbox do banco legado, com snapshot lógico e hash do original. F8 exige evidências atuais de F5/F7/Playwright, check verde e instalador Windows válido antes de emitir certificação.

**Tech Stack:** Node.js 22, `node:sqlite`, Electron, Vite, Playwright, electron-builder/NSIS.

**Spec:** `docs/superpowers/specs/2026-09-18-phases-7-8-design.md`

## Global Constraints

- `productId=fleet-maintenance`.
- banco único `artisys-frota-manutencao.sqlite`.
- migrations obrigatórias: `frota/001-initial.sql` e `manutencao/001-initial.sql`.
- o original legado nunca recebe escrita.
- evidências pertencem ao commit atual.
- core obrigatório R$0/self-hosted/open source.
- monorepo permanece rollback/reference.

---

### Task 1: Evidence helpers

**Files:** Create `tooling/evidence.mjs`; modify `tooling/qa-phase5.mjs`; test `tests/evidence.test.js`.

**Interfaces:** `currentCommit(): Promise<string>`; `writeEvidence(path,payload): Promise<object>`.

- [ ] Write failing test requiring full 40-char Git SHA.
- [ ] Run `node --test tests/evidence.test.js`; expect missing-module failure.
- [ ] Implement `currentCommit` via `execFile('git',['rev-parse','HEAD'])` and atomic evidence JSON writing via temp file + rename.
- [ ] Include `commit` in F5 pass/fail summaries.
- [ ] Run test and `npm run phase5`; require matching commit in summary.
- [ ] Commit as `test: bind qa evidence to current commit`.

### Task 2: Deterministic SQLite snapshot

**Files:** Create `tooling/sqlite-snapshot.mjs`; test `tests/sqlite-snapshot.test.js`.

**Interfaces:** `snapshotSqlite(path)` and `assertLegacyTablesPreserved(before,after,ignoredTables)`.

- [ ] Build temporary SQLite fixture with two rows in a user table and write failing preservation test.
- [ ] Run RED.
- [ ] Implement deterministic table list, column list, stable row serialization, binary-to-hex conversion, row count and SHA-256 using `DatabaseSync`.
- [ ] Require every table existing before upgrade to retain row count and digest, except explicitly permitted internal migration/history tables.
- [ ] Run GREEN.
- [ ] Commit as `test: add deterministic legacy database snapshot`.

### Task 3: Phase 7 combined cutover rehearsal

**Files:** Create `tooling/phase7-cutover.mjs`; test `tests/phase7-cutover.test.js`; modify `runtime/host.mjs` only if `schemaState` is unavailable.

**Interfaces:** consumes `ARTISYS_LEGACY_DB`; produces `qa-artifacts/phase7-summary.json`.

- [ ] Write failing missing-source test requiring `ARTISYS_LEGACY_DB is required`.
- [ ] Write failing test with temporary `artisys-frota-manutencao.sqlite` and original SHA verification.
- [ ] Run tests RED.
- [ ] Implement: validate source → hash/snapshot original → copy to temp under exact filename → open standalone host → require `productId=fleet-maintenance` → require both `frota/001-initial.sql` and `manutencao/001-initial.sql` → backup → write sentinel → close/reopen → verify → restore → verify sentinel absent → compare preexisting tables → hash original again → evidence with current commit.
- [ ] If required, expose `schemaState` as direct proxy without altering DB behavior.
- [ ] Run tests GREEN and assert both namespaces are present.
- [ ] Commit as `test: add combined fleet maintenance cutover rehearsal`.

### Task 4: Playwright evidence wrapper

**Files:** Create `tooling/qa-web.mjs`; modify `package.json`; test `tests/qa-web-evidence.test.js`.

**Interfaces:** produces `qa-artifacts/playwright-summary.json`.

- [ ] Write failing test for summary `{status,commit,exitCode,startedAt,finishedAt}`.
- [ ] Implement wrapper invoking `npm run qa:web:raw` through Node + npm exec path, inheriting console output and persisting evidence even on failure.
- [ ] Set `qa:web:raw="playwright test"` and `qa:web="node tooling/qa-web.mjs"`.
- [ ] Run unit test plus `npm run qa:web`; require commit-matched evidence.
- [ ] Commit as `test: persist playwright release evidence`.

### Task 5: Phase 8 certification

**Files:** Create `tooling/certify-release.mjs`; test `tests/certify-release.test.js`; modify `package.json`.

**Interfaces:** reads F5/F7/Playwright summaries and `release/ArtiSys-Frota-Setup-*.exe`; writes `qa-artifacts/release-certification.json`.

- [ ] Write stale-evidence test requiring rejection when any evidence commit differs from HEAD.
- [ ] Write missing-installer test requiring rejection.
- [ ] Run tests RED.
- [ ] Implement certifier: all statuses passed; commits match HEAD; installer matches `ArtiSys-Frota-Setup-*.exe`; size > 1 MiB; generated during current certification window; compute and record SHA-256.
- [ ] Add scripts `phase7`, `phase8:certify`, and `release:certify="npm run phase5 && npm run phase7 && npm run qa:web && npm run check && npm run build:win && npm run phase8:certify"`.
- [ ] Run certifier unit tests GREEN.
- [ ] Commit as `feat: add fail closed fleet release certification`.

### Task 6: Final documentation and fresh verification

**Files:** Create `docs/PHASES_7_8.md`; modify `PRODUCT_STATUS.md`, `.woodpecker/verify.yml`.

- [ ] Keep CI non-destructive: install dependencies, `npm run check`, `npm run phase5`, `npm run qa:web`; no real customer DB is mounted in CI.
- [ ] Document exact Windows command: `$env:ARTISYS_LEGACY_DB="C:\caminho\artisys-frota-manutencao.sqlite"; npm run release:certify`.
- [ ] Run fresh sequence: install; install Chromium; `npm run check`; `npm run phase5`; Phase 7 with real legacy DB; `npm run qa:web`; `npm run build:win`; `npm run phase8:certify`.
- [ ] Require all exit codes zero, both migration namespaces in F7 evidence, and certification status `passed` before marking homologado.
- [ ] Confirm monorepo rollback remains present and untouched.
- [ ] Commit docs as `docs: record fleet maintenance certification gate`.
