# Plan técnico — dominicode-job-hunt

> Derivado de `spec.md` (aprobada el 2026-11-06, con sus decisiones: inglés, Node, HTML imprimible, gratis, repo privado hasta pasar el detector).

---

## 1. Stack final

- **Contenido:** Markdown (`SKILL.md`, referencias por rol, plantillas de `jobs/`) — es lo que leen Codex, Claude Code y las herramientas compatibles con AGENTS.md.
- **Build y scripts:** Node ≥ 20, ESM y sin dependencias en runtime — Codex y Claude Code ya lo exigen, y `sync-agents.mjs` demuestra que generar los TOML es trivial.
- **Dependencias de desarrollo:** `yaml` (validar el frontmatter en modo estricto) y `smol-toml` (parsear los `.toml` generados). Solo en `devDependencies`: el usuario final no instala nada.
- **Exportación del CV:** `export-cv.mjs` sin dependencias convierte el subconjunto de Markdown que usa un CV (títulos, párrafos, listas, negrita, cursiva y enlaces) en un HTML de una página con `@page` y estilos de impresión. Si encuentra `pandoc` en el PATH, genera además el DOCX.
- **Test runner:** `node --test` (integrado en Node 20, sin dependencias) — caso D: proyecto nuevo, decidido aquí.
- **E2E:** sesiones reales con `codex exec` y con Claude Code sobre un CV ficticio, como verificación manual documentada en `tasks.md`, porque cuestan tokens y dependen del modelo.
- **CI:** GitHub Actions con `npm test` (incluye que `plugins/` coincide con lo que genera el build y el detector de datos personales). Se activa en la fase 0.

### Stacks descartados

- **Bun:** descartado por decisión del 2026-11-06; obligaría a instalarlo a quien quiera contribuir.
- **pandoc + Chrome headless como vía principal:** frágil en Windows (hace falta `--user-data-dir`, falla en silencio con Chrome abierto). Queda solo como extra opcional para el DOCX.
- **Publicar en npm (`npx dominicode-job-hunt`):** no hace falta en la v1, porque los dos marketplaces instalan desde git. Se reconsidera si piden instalarlo sin git.

---

## 2. Modelo de datos

No hay base de datos. Las entidades son ficheros Markdown con frontmatter en el `jobs/` del usuario; el esquema se mantiene del sistema original, sin datos personales.

- **Criterios** (`jobs/criterios.md`) — campos: `roles`, `stack`, `seniority`, `salario_minimo`, `moneda`, `modalidad`, `pais_contratacion`, `zonas_horarias`, `idiomas`, `exclusiones`, pesos de scoring y estados. Uno por usuario.
- **Perfil** (`jobs/perfil/cv-fuente.md` → `candidato.md`, `cv-base-en.md`, `linkedin-optimizado.md`) — uno por usuario y derivado de la fuente.
- **Oferta** (`jobs/ofertas/YYYY-MM-DD-empresa-rol.md`) — `empresa`, `rol`, `url`, `fuente`, `salario`, `stack`, `score`, `score_revisado`, `status`, `vigente`, `verificada`, fechas y follow-ups. Tiene 0..1 Candidatura y 0..1 Entrevista.
- **Candidatura** (`jobs/aplicaciones/<slug>/`) — `cv.md`, `cv.html`, `cover-letter.md`, `mensaje-recruiter.md`, `formulario.md`, `checklist.md` y `follow-up-<n>.md`. Pertenece a una Oferta.
- **Entrevista** (`jobs/entrevistas/<slug>/`) — preparación por tipo, `gracias-<fase>.md` y `post-mortem-<fase>.md`. Pertenece a una Oferta.
- **Tracker** (`jobs/tracker.md`) — pipeline, cerradas y métricas semanales; se reconstruye a partir de las fichas.
- **Priorización** (`jobs/priorizacion-YYYY-MM-DD.md`) — informe con la lista corta, `mantener` y cierres propuestos.

Valores de `status`: `nueva | revisar | aplicar | aplicada | entrevista | oferta | descartada | sin_respuesta`.

> **Ajuste del 2026-11-06 (fase 4):** como las instrucciones van en inglés, los nombres de ficheros, carpetas, campos y estados que ve el usuario también: `jobs/criteria.md`, `profile/cv-source.md`, `offers/`, `applications/`, `interviews/`, `rank-YYYY-MM-DD.md`; estados `new | review | apply | discarded | applied | interview | offer | accepted | rejected | closed | no_response`. Los subcomandos aceptan los dos idiomas. El contrato exacto está en `src/skill/references/files.md` (fuente única para los 5 roles).

---

## 3. Contratos

### Estructura del repo

```
src/                                   ← fuente única (se edita aquí)
  skill/SKILL.md                       ← orquestador, en inglés, frontmatter YAML estricto
  skill/references/                    ← un .md por rol + browser.md + scoring.md + single-agent.md
  skill/templates/jobs/                ← plantillas que copia init
  skill/scripts/export-cv.mjs
  agents/job-{profile,scout,rank,application,interview}.md   ← frontmatter neutro + cuerpo
plugins/dominicode-job-hunt/           ← GENERADO y versionado (los marketplaces instalan desde git)
  .codex-plugin/plugin.json            ← skills: ./skills/
  .claude-plugin/plugin.json
  skills/job-hunt/…                    ← copia de src/skill + codex-agents/*.toml dentro
  agents/*.md                          ← agentes de Claude Code
  AGENTS.md                            ← copia autocontenida para Cursor, Gemini, Aider… (se movió aquí el 2026-11-06: el AGENTS.md de la raíz es el carril del mantenedor)
.agents/plugins/marketplace.json       ← marketplace de Codex (source local → ./plugins/dominicode-job-hunt)
.claude-plugin/marketplace.json        ← marketplace de Claude Code
AGENTS.md                              ← carril del mantenedor (NO generado)
scripts/build.mjs · scripts/check-leaks.mjs · scripts/leak-patterns.mjs · scripts/run-tests.mjs   ← solo mantenedor
src/skill/scripts/install-codex-agents.mjs · src/skill/scripts/export-cv.mjs                     ← llegan al usuario dentro de la skill
test/*.test.mjs
```

### Contratos de los scripts

- `node scripts/build.mjs` — lee `src/` y escribe `plugins/` y `AGENTS.md`. Sale con código 1, indicando fichero y línea, si falla el YAML, el TOML o el detector. `--check` no escribe nada: falla si lo generado no coincide con lo que está en el repo (lo usa CI).
- `node scripts/check-leaks.mjs [paths]` — busca patrones prohibidos y devuelve una lista de `{file, line, pattern}`. Tiene dos listas:
  - **Pública**, en `scripts/leak-patterns.mjs`: el nombre del mantenedor fuera de los créditos, la marca salvo en el identificador del paquete, rutas absolutas de Windows y de usuario, la carpeta de marca del original y la cifra de salario del original.
  - **Privada**, en `.leak-blocklist.local` (gitignored; o la ruta que indique `LEAK_BLOCKLIST`): empresas y personas de procesos reales, un término por línea. **Nunca va al repo:** publicada, revelaría a qué empresas ha aplicado el mantenedor. CI solo aplica la lista pública; el build local aplica las dos. (Ajuste del 2026-11-06, al empezar la fase 1.)
- `node <skill>/scripts/install-codex-agents.mjs [--project] [--force] [--source d] [--target d]` — copia `<skill>/codex-agents/*.toml` a `$CODEX_HOME/agents/` (por defecto `~/.codex/agents/`) o a `./.codex/agents/` con `--project`. No sobrescribe un fichero distinto sin `--force` e informa de lo copiado, lo saltado y lo idéntico. **Va dentro de la skill** (no en `scripts/` del repo) para que lo tenga quien instala desde el marketplace, sin clonar el repo (ajuste del 2026-11-06).
  - **Hallazgo del E2E (2026-11-06, codex-cli 0.166):** Codex ignora `.codex/agents/` de un proyecto que no está marcado como `trust_level = "trusted"` en `~/.codex/config.toml`. Por eso la instalación **global** es la vía por defecto (y la que propone `init`), y `--project` imprime cómo marcar el proyecto como de confianza. [Configuración de Codex](https://developers.openai.com/codex/config-reference) · [openai/codex#26408](https://github.com/openai/codex/issues/26408).
- `node <skill>/scripts/export-cv.mjs <cv.md> [--out dir]` — genera `cv.html` (y `cv.docx` si hay pandoc). Avisa si el contenido estimado pasa de una página.

### Contratos de la skill (`$job-hunt` en Codex, `/dominicode-job-hunt:job-hunt` en Claude Code)

Subcomandos: `init`, `perfil|profile`, `buscar|search`, `priorizar|rank`, `aplicar|apply`, `entrevista|interview`, `seguimiento|follow-up`, `estado|status` y sin argumento. Se aceptan en los dos idiomas.

- **Detección de capacidades (al empezar cada subcomando):** (1) ¿hay agentes `job-*`? (2) ¿hay navegador conectado? (3) ¿se pueden lanzar agentes en paralelo? Cada respuesta elige una rama ya escrita en `references/`, sin improvisar.
- **Sin agentes propios (`single-agent.md`):** el agente principal lee `references/<rol>.md` y ejecuta él mismo el rol.
- **Navegador (`browser.md`):** describe qué capacidad hace falta ("abrir una URL y leer el texto de la página con la sesión del usuario") y cómo reconocer un login o un captcha. No nombra ninguna herramienta concreta.
- **`init` en Codex:** si faltan los `.toml` de los agentes, ofrece instalarlos de forma global con `node <skill>/scripts/install-codex-agents.mjs` y pide confirmación antes de escribir en `~/.codex`. No propone `--project` salvo que el usuario lo pida (en ese caso, le avisa de lo de la confianza).

### Agentes (5)

`job-profile`, `job-scout`, `job-rank`, `job-application` y `job-interview`. En Claude Code son `.md` con `tools` reales; en Codex son `.toml` con `name`, `description` y `developer_instructions`, sin `tools` (heredan las de la sesión). El cuerpo es el mismo `references/<rol>.md`, y así el modo con un solo agente y los agentes no pueden divergir.

### Trazabilidad spec §3 → plan

| Módulo de la spec | Contrato |
|---|---|
| Instalación y distribución | marketplaces, `plugin.json` ×2, `install-codex-agents.mjs`, `AGENTS.md`, `single-agent.md` |
| Configuración (`init`) | subcomando `init` + `templates/jobs/` + entidad Criterios |
| Perfil | `job-profile` + entidad Perfil |
| Búsqueda | `job-scout` + `browser.md` + `scoring.md` + entidad Oferta |
| Priorización | `job-rank` + rama paralela o secuencial + entidad Priorización |
| Candidatura | `job-application` + `export-cv.mjs` + entidad Candidatura |
| Entrevistas | `job-interview` + entidad Entrevista |
| Seguimiento | subcomandos `seguimiento`, `estado` y sin argumento + Tracker |
| Build y calidad | `build.mjs`, `check-leaks.mjs`, `--check` en CI |

Ninguna funcionalidad queda sin contrato.

---

## 4. Dependencias externas

- **LinkedIn (vía el navegador del usuario)** — búsqueda y lectura de ofertas. Si no hay navegador o pide login o captcha, se busca solo en boards con API.
- **RemoteOK API (`https://remoteok.com/api`)** — board sin sesión. Si falla, se prueban otros boards configurados en `criterios.md` (lista editable). Si fallan todos, el scout lo dice y no inventa ofertas.
- **pandoc (opcional)** — DOCX. Si no está, se entrega solo el HTML imprimible.
- **Codex CLI / Claude Code** — anfitriones. Si una versión no carga los agentes, se usa el modo con un solo agente.

---

## 5. Riesgos técnicos y mitigaciones

- **Riesgo:** al quitar los datos personales, los prompts pierden calidad (el original funciona porque es muy concreto). **Mitigación:** cada `references/<rol>.md` mantiene ejemplos concretos con un candidato ficticio coherente, y el E2E compara la salida con la del sistema original sobre la misma oferta.
- **Riesgo:** formatos de Codex que cambian (plugins, marketplace y agentes son recientes; #18988 sigue abierta). **Mitigación:** manifiestos mínimos, versión probada en el README, y un test que parsea los manifiestos. Cuando Codex permita agentes en los plugins, se quita el instalador.
- **Riesgo:** se cuela un dato real del mantenedor o de un proceso de selección real. **Mitigación:** `check-leaks.mjs` (lista pública en CI + lista privada local) en el build, en el test y en CI. No se copia ningún fichero de `companyAgents/jobs/`. El historial de git ya contiene nombres de empresas reales (commit `019d16c`), así que el repo se publica con historial nuevo (TASK-82).
- **Riesgo:** LinkedIn restringe la cuenta por uso automatizado. **Mitigación:** solo lectura, máximo 25 fichas por tanda, parar ante login o captcha y aviso en el README y en `init`.
- **Riesgo:** `plugins/` generado y desincronizado de `src/`. **Mitigación:** `build --check` en `npm test` y en CI.

---

## 6. Orden de construcción

1. **Fase 0 — Esqueleto y harness:** `package.json`, `node --test`, CI y `AGENTS.md` del repo (el carril para agentes). Va primero porque sin runner no hay TDD.
2. **Detector de datos personales** — antes de copiar una sola línea del original, para que lo atrape todo desde el principio.
3. **Build** (fuente → Codex, Claude y AGENTS.md, con validación YAML/TOML y `--check`) — es el mayor riesgo técnico y lo necesita todo lo demás.
4. **Instalador de agentes de Codex** — la prioridad del usuario.
5. **Contenido:** SKILL.md + `single-agent.md` + `browser.md` + `scoring.md` + plantillas de `init`, y después los 5 roles, quitando los datos personales del original rol a rol.
6. **`export-cv.mjs`.**
7. **Marketplaces, README ES/EN y E2E** en Codex y Claude Code con el CV ficticio.

---

## 7. Estrategia de ejecución

- [x] **Modo paso a paso:** el mantenedor indica qué tarea ejecutar. Lo elijo porque el contenido de los prompts necesita su criterio (qué se queda del original y qué se generaliza).
- [ ] Modo bucle autónomo: válido para las fases 0–4 y 6 (código con tests) si el mantenedor lo prefiere.

---

## 8. Definición de terminado del plan

- [x] Toda funcionalidad de §3 tiene contrato (tabla de trazabilidad)
- [x] Todo riesgo tiene mitigación
- [x] El orden de construcción no tiene ciclos
- [x] Test runner decidido: `node --test`
- [x] Estrategia de ejecución elegida
- [x] Stack coherente con las decisiones de la spec y con `sync-agents.mjs`
- [x] El mantenedor confirma el stack
