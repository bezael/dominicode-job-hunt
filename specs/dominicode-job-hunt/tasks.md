# Tasks — dominicode-job-hunt

**Status:** In Progress

> Valores: **Not Started** · **In Progress** · **Completed**. `specs/INDEX.md` refleja este estado.
> Derivado de `spec.md` + `plan.md` (los dos confirmados el 2026-11-06). Ejecutar en orden: 🔴 → 🟢 → 🔵.
> Si una tarea descubre un hueco en la spec, primero se corrige la spec y después el código.

## Convenciones

- ⚙️ Setup · 🔴 test que falla · 🟢 implementación mínima · 🔵 refactor · 🔗 integración o E2E · 👤 revisión del mantenedor
- `[x]` = Verify ejecutado con el resultado esperado y Evidence anotada. Nunca "el agente dice que ha terminado".
- Comando de regresión completo: `npm test` (= `node --test` + `node scripts/build.mjs --check`).

---

## Fase 0 — Esqueleto y runner (ruta B: proyecto nuevo, sin runner)

- [x] TASK-00 — ⚙️ **Runner decidido:** `node --test` (Node ≥ 20), en `plan.md` §1. Evidencia: plan confirmado el 2026-11-06.
- [x] TASK-01 — ⚙️ **`package.json`** — Files: `package.json` (`type: module`, `engines.node >=20`, scripts `test`, `build`, `check`; devDeps `yaml`, `smol-toml`). Verify: `node --version && npm install && npm run test --if-present`. Done when: `npm install` termina sin errores. Evidence: `npm install` → 0 vulnerabilities (Node v24.16.0, npm 11.13.0), 2026-11-06. `test` = `node scripts/run-tests.mjs`, porque Node 20 no expande globs en `--test` (lo descubrió el primer run de CI). `build --check` se añade a `test` en TASK-31.
- [x] TASK-02 — ⚙️ **Smoke test del runner** — Files: `test/smoke.test.mjs`, `scripts/run-tests.mjs`. Verify: `npm test`. Done when: 1 test pasa con exit 0. Evidence: `npm test` → pass 1, fail 0, 2026-11-06.
- [x] TASK-03 — ⚙️ **CI** — Files: `.github/workflows/test.yml` (Node 20 y 22, `npm ci && npm test`). Verify: el primer push deja el workflow en verde en GitHub. Done when: check verde en el commit. Evidence: primer run en rojo en Node 20 ("Could not find test/*.test.mjs"), corregido; run 42241041630 → success en 20 y 22, 2026-11-06.
- [x] TASK-04 — ⚙️ **Carril para agentes y estructura** — Files: `AGENTS.md` del repo (comandos reales, "no editar `plugins/` a mano", "nada de `companyAgents/jobs/`"), `.gitignore` (`jobs/`, `node_modules/`, `specs/**/.work/`), carpetas de `plan.md` §3. Verify: `git check-ignore jobs/x.md && ls src/skill src/agents scripts test`. Done when: `jobs/` está ignorado y las rutas existen. Evidence: `git check-ignore -v` → `jobs/x.md` y `.work/` ignorados; las rutas existen (`.gitkeep` en las vacías), 2026-11-06.

> No se pasa a la fase 1 hasta que TASK-02 esté en verde.

---

## Fase 1 — Detector de datos personales

### Funcionalidad: "El sistema bloquea el build si encuentra datos personales del mantenedor"

- [x] TASK-10 — 🔴 **Test: el detector encuentra cada patrón prohibido** — Criterion: spec §3 Build y calidad. Files: `test/check-leaks.test.mjs`, `test/fixtures/leaks/*.md`. Verify: `node --test test/check-leaks.test.mjs`. Done when: falla porque no existe `scripts/check-leaks.mjs` y no por un error de sintaxis. Casos generados en memoria (sin fixtures con nombres reales): el nombre del mantenedor, el del perfil de navegador, una ruta de unidad de Windows, la carpeta de marca, la marca suelta (y el identificador del paquete permitido), la cifra de salario del original, y un término de una lista privada **ficticia** (`Acme Hiring Corp`). Evidence: rojo con ERR_MODULE_NOT_FOUND de scripts/check-leaks.mjs (falta el módulo, no hay error de sintaxis), 2026-11-06.
- [x] TASK-11 — 🟢 **`scripts/check-leaks.mjs`** — devuelve `{file, line, pattern}[]` y sale con 1 si hay alguna coincidencia. Lista pública en `scripts/leak-patterns.mjs`; lista privada en `.leak-blocklist.local` (gitignored) o `LEAK_BLOCKLIST`. Verify: `node --test test/check-leaks.test.mjs`. Done when: exit 0. Evidence: `node --test test/check-leaks.test.mjs` → pass 10, fail 0. Sobre specs/ con la lista privada marcó tres nombres de empresas reales en plan.md, corregido, 2026-11-06.
- [x] TASK-12 — 🔴 **Test: los créditos están permitidos** — `Bezael Pérez · Dominicode` dentro de `<!-- credits -->…<!-- /credits -->` o en `author` de un `plugin.json` no se marca; fuera de esos bloques, sí. Verify: igual que en TASK-10. Done when: falla por la regla de créditos. Evidence: 2 tests nuevos (bloque credits y author/developerName en JSON) → fail 2 por la regla que faltaba, 2026-11-06.
- [x] TASK-13 — 🟢 **Excepción de créditos** — Verify: `node --test test/check-leaks.test.mjs`. Done when: exit 0 en todos los casos de TASK-10 y TASK-12. Evidence: `node --test test/check-leaks.test.mjs` → pass 12, fail 0; `npm test` → pass 13, fail 0, 2026-11-06.

---

## Fase 2 — Build (fuente → Codex, Claude Code y AGENTS.md)

### Funcionalidad: "El mantenedor puede generar con un comando las salidas de Codex, Claude Code y AGENTS.md"

- [x] TASK-20 — 🔴 **Test: cada agente de `src/agents/` genera un `.toml` de Codex válido** — con `name`, `description` y `developer_instructions` parseables por `smol-toml`, en `plugins/dominicode-job-hunt/skills/job-hunt/codex-agents/`. Files: `test/build.test.mjs`, `test/fixtures/src-min/`. Verify: `node --test test/build.test.mjs`. Done when: falla porque no hay build. Evidence: rojo: ERR_MODULE_NOT_FOUND de scripts/build.mjs, 2026-11-06.
- [x] TASK-21 — 🟢 **`scripts/build.mjs`: salida de Codex** (skill copiada, TOML y `.codex-plugin/plugin.json` con `skills: ./skills/`) — Verify: `node --test test/build.test.mjs`. Done when: exit 0. Evidence: `node --test test/build.test.mjs` → pass 2, fail 0 (TOML parseado con smol-toml; la instrucción con triple comilla sale como string básico), 2026-11-06.
- [x] TASK-22 — 🔴 **Test: un frontmatter YAML inválido aborta** — por ejemplo, una `description` sin comillas con `": "`. Exit 1 con `fichero:línea`. Verify: igual. Done when: falla por falta de validación. Evidence: 3 tests nuevos → fail 3 (no había validación), 2026-11-06.
- [x] TASK-23 — 🟢 **Validación de YAML en modo estricto con `yaml`** — Verify: igual. Done when: exit 0. Evidence: pass 5, fail 0; el error indica `src/agents/job-alpha.md:3`, 2026-11-06.
- [x] TASK-24 — 🔴 **Test: salida de Claude Code** — `.claude-plugin/plugin.json` válido y `agents/*.md` con `tools` reales (mapeados desde las herramientas neutras del frontmatter). Verify: igual. Done when: falla. Evidence: 3 tests nuevos (tools mapeadas, browser hereda todas las herramientas, tool desconocida aborta) → fallan, 2026-11-06.
- [x] TASK-25 — 🟢 **Salida de Claude Code** — Verify: igual. Done when: exit 0. Evidence: pass 9, fail 0, 2026-11-06.
- [x] TASK-26 — 🔴 **Test: copia `AGENTS.md`** — la skill sin el frontmatter, con un índice de los roles y las referencias en línea o enlazadas. Verify: igual. Done when: falla. Evidence: test del AGENTS.md (sin frontmatter, roles, referencias y plantillas en línea) → falla. La salida va en plugins/dominicode-job-hunt/AGENTS.md, porque el de la raíz es el carril, 2026-11-06.
- [x] TASK-27 — 🟢 **Generar `AGENTS.md`** — Verify: igual. Done when: exit 0. Evidence: pass 9, fail 0 (junto con TASK-25), 2026-11-06.
- [x] TASK-28 — 🔴 **Test: una fuga aborta el build sin escribir nada** — `plugins/` queda intacto. Verify: igual. Done when: falla. Evidence: 2 tests (fuga pública y término privado ficticio) → fallan, 2026-11-06.
- [x] TASK-29 — 🟢 **El build ejecuta `check-leaks` antes de escribir** — Verify: igual. Done when: exit 0. Evidence: pass 13, fail 0; el build escanea src/ y las salidas en memoria antes de escribir, 2026-11-06.
- [x] TASK-30 — 🔴 **Test: `--check` detecta desincronización** — si se toca un fichero de `plugins/`, sale con 1 y no escribe nada. Verify: igual. Done when: falla. Evidence: 2 tests de --check (modified/extra/missing sin escribir) → fail, 2026-11-06.
- [x] TASK-31 — 🟢 **Modo `--check`** — Verify: `npm test`. Done when: exit 0. Evidence: `npm test` = run-tests + `build --check`: primero falla con "missing: …", después de `npm run build` → pass 26, fail 0, "in sync (4 files)". Se añadió un SKILL.md provisional (lo sustituye TASK-51) y .gitattributes eol=lf, 2026-11-06.
- [x] TASK-32 — 🔵 **Refactor del build** (separar los emisores por destino) — Verify: `npm test` antes y después. Done when: verde en las dos pasadas. Evidence: generate() separado en loadSource + emitCodex/emitClaude/emitMirror; `npm test` → pass 26, fail 0 antes y después, 2026-11-06.

---

## Fase 3 — Instalador de agentes de Codex

### Funcionalidad: "El usuario puede instalar los agentes en Codex con un instalador"

- [x] TASK-40 — 🔴 **Test: copia los `.toml` a `$CODEX_HOME/agents/` (con un CODEX_HOME temporal) y, con `--project`, a `./.codex/agents/`** — Files: `test/install.test.mjs`. Verify: `node --test test/install.test.mjs`. Done when: falla porque no existe el script. Evidence: ERR_MODULE_NOT_FOUND de `src/skill/scripts/install-codex-agents.mjs`, 2026-11-06.
- [x] TASK-41 — 🟢 **`src/skill/scripts/install-codex-agents.mjs`** (dentro de la skill, ver plan §3) — Verify: igual. Done when: exit 0. Evidence: pass 4, fail 0, 2026-11-06.
- [x] TASK-42 — 🔴 **Test: no sobrescribe un fichero distinto sin `--force`** e informa de lo copiado, lo saltado y lo que es idéntico. Verify: igual. Done when: falla. Evidence: 3 tests nuevos → fail 2 (el de `--force` ya pasaba porque se sobrescribía siempre), 2026-11-06.
- [x] TASK-43 — 🟢 **Regla de no sobrescribir + `--force`** — Verify: `npm test`. Done when: exit 0. Evidence: install pass 7/7; `npm test` → pass 33, fail 0, in sync, 2026-11-06.
- [ ] TASK-44 — 🔗 **Instalación real en Codex** — instalación **global** (la de por defecto) de los 5 agentes reales, con Codex reiniciado. Verify (manual, mantenedor): `codex exec "List your custom agents"` muestra los 5 `job-*`. Done when: aparecen los 5. **Pendiente de la fase 4** (aún no hay agentes reales). Evidence: primer intento el 2026-11-06 con 2 agentes ficticios y `--project` en una carpeta temporal → Codex **no** los cargó (solo listó los globales) porque la carpeta no era de confianza. El auto mode bloqueó modificar `~/.codex/config.toml` para comprobarlo con trust → se cambió el diseño (TASK-45).
- [x] TASK-45 — 🔴🟢 **Aviso de confianza en `--project`** (surgió en TASK-44) — `--project` imprime el bloque `[projects.'<ruta>'] trust_level = "trusted"` y la alternativa global; la instalación global no lo imprime. Verify: `node --test test/install.test.mjs`. Done when: exit 0. Evidence: rojo con fail 1 → verde pass 9; `npm test` → pass 35, fail 0, in sync, 2026-11-06.

---

## Fase 4 — Contenido (skill, roles, plantillas)

> Regla de la fase: cada rol se reescribe desde `companyAgents/.claude/agents/job-*.md` **generalizándolo**: los criterios salen de `jobs/criterios.md`, el navegador de `browser.md` y los ejemplos son de un candidato ficticio. No se copia ningún fichero de `companyAgents/jobs/`.

### Funcionalidades: orquestador, modo sin agentes, navegador y seguimiento

- [x] TASK-50 — 🔴 **Test de estructura del contenido** — `SKILL.md` declara los 8 subcomandos con sus alias ES/EN; existe `references/<rol>.md` por cada agente; el cuerpo de cada agente generado es igual a su `references/<rol>.md` (una sola fuente); `single-agent.md`, `browser.md` y `scoring.md` existen; ningún fichero de contenido nombra `mcp__`. Files: `test/content.test.mjs`. Verify: `node --test test/content.test.mjs`. Done when: falla. Evidence: test/content.test.mjs → pass 2, fail 9 (SKILL.md provisional, sin referencias ni plantillas), 2026-11-06.
- [x] TASK-51 — 🟢 **`SKILL.md` (inglés) + `single-agent.md` + `browser.md` + `scoring.md`** — incluye detección de capacidades, `seguimiento`, `estado`, la lógica sin argumento, "nunca enviar", "sin `criterios.md` → proponer `init`" y "login/captcha → parar LinkedIn y seguir con los boards". Verify: `node --test test/content.test.mjs && node scripts/check-leaks.mjs src`. Done when: los dos con exit 0. Evidence: SKILL.md (8 subcomandos ES/EN, Rules, Capabilities, sin argumento) + single-agent.md, browser.md, scoring.md y files.md (contrato de ficheros compartido por los 5 roles, añadido por coherencia). Un fallo (Capabilities no nombraba los agentes job-*) corregido. `npm test` → pass 46, fail 0; `check-leaks src` → sin fugas, 2026-11-06.

### Funcionalidad: "El usuario puede ejecutar `init`…" (+ volver a ejecutarlo sin perder datos)

- [x] TASK-52 — 🔴 **Test de plantillas** — `templates/jobs/criterios.md` tiene todos los campos de `plan.md` §2; existen `tracker.md`, `perfil/README.md` y `.gitignore` (excluye `jobs/`); la sección `init` de `SKILL.md` contiene las reglas de no sobrescribir y de instalar los agentes de Codex con confirmación. Verify: `node --test test/content.test.mjs`. Done when: falla. Evidence: tests de plantillas en rojo dentro de las 9 de TASK-50, 2026-11-06.
- [x] TASK-53 — 🟢 **Plantillas + sección `init`** — Verify: igual + `check-leaks`. Done when: exit 0. Evidence: criteria.md (14 campos, pesos que suman 100), tracker.md, profile/README.md, .gitignore con *; sección init con no sobrescribir, instalador con confirmación y aviso de --project. `npm test` → pass 46, fail 0, in sync (13 files), 2026-11-06.

### Funcionalidades por rol

- [x] TASK-54 — 🔴 **Test: ningún rol fija criterios** — cada `references/job-*.md` cita `jobs/criterios.md` y no contiene salario, stack ni país literales fuera de los bloques `Example (fictional candidate)`. Verify: `node --test test/content.test.mjs`. Done when: falla. Evidence: 5 tests nuevos en content.test.mjs (helper de ejemplos, 5 agentes, sin salario/framework/país/geoId fuera de `Example (fictional candidate)`, never send, [PENDING]); rojo con ENOENT en los 5 roles, 2026-11-06.
- [x] TASK-55 — 🟢 **Rol `job-profile`** (CV base, LinkedIn y `[PENDIENTE]`) — Verify: tests + `check-leaks`. Done when: exit 0. Evidence: `references/job-profile.md` + `src/agents/job-profile.md`: sin fuentes de la carpeta de marca; posicionamiento desde criteria; sección Stories para STAR; `npm test` pass 52, `check-leaks src plugins` limpio, 2026-11-06.
- [x] TASK-56 — 🟢 **Rol `job-scout`** (búsquedas construidas desde los criterios, boards con API, máx. 25 fichas, parar ante login o captcha) — Verify: igual. Done when: exit 0. Evidence: `job-scout.md`: URLs con `location=` (sin geoId) y `f_E` desde seniority; APIs remoteok/remotive/himalayas comprobadas con curl hoy (campos documentados); máx. 25 fichas y 25 páginas; datos ≠ instrucciones. Mismo Verify en verde, 2026-11-06.
- [x] TASK-57 — 🟢 **Rol `job-rank`** (lotes, `verificada: no` si no se puede comprobar, rama paralela o secuencial en `SKILL.md`, nada cambia de `status` sin OK) — Verify: igual. Done when: exit 0. Evidence: `job-rank.md`: solo escribe still_open/verified/score_reviewed + History; navegador ≤ 10 páginas; RANK_RESULT; excepciones del usuario respetadas. Verde, 2026-11-06.
- [x] TASK-58 — 🟢 **Rol `job-application`** (materiales, usa `export-cv.mjs`, nunca enviar, perfil ausente → ejecutar `perfil` antes) — Verify: igual. Done when: exit 0. Evidence: `job-application.md`: `node <skill>/scripts/export-cv.mjs`, sin perfil → para y pide `profile`, never send, cobertura de keywords y riesgos en checklist.md. SKILL.md pasa `<skill>` y la fecha a los agentes. Verde, 2026-11-06.
- [x] TASK-59 — 🟢 **Rol `job-interview`** (tipos, STAR solo con experiencia real, negociación desde el salario objetivo, post-mortem) — Verify: igual. Done when: exit 0. Evidence: `job-interview.md`: tabla tipo → secciones, STAR solo con Stories reales o [PENDING], ancla/objetivo/suelo desde candidate.md + criteria, post-mortem. Verde, 2026-11-06.
- [ ] TASK-5A — 👤 **Revisión del contenido por el mantenedor** — lee `SKILL.md` y los 5 roles y marca qué se ha perdido respecto al original. Verify: comentarios resueltos. Done when: el mantenedor da el OK. Evidence: —

---

## Fase 5 — Exportación del CV

### Funcionalidad: "El usuario puede exportar el CV adaptado a PDF y DOCX"

- [x] TASK-60 — 🔴 **Test: Markdown de CV → HTML imprimible** — títulos, párrafos, listas, negrita, cursiva y enlaces; incluye `@page` y CSS de impresión; escapa el HTML del contenido. Files: `test/export-cv.test.mjs`. Verify: `node --test test/export-cv.test.mjs`. Done when: falla. Evidence: test/export-cv.test.mjs (5 tests: bloques, inline, saltos de línea, escape incl. href javascript:, @page/@media print/letter); rojo con ERR_MODULE_NOT_FOUND, 2026-11-06. Escrito junto con TASK-62 en un solo rojo.
- [x] TASK-61 — 🟢 **`src/skill/scripts/export-cv.mjs`** (sin dependencias) — Verify: igual. Done when: exit 0. Evidence: src/skill/scripts/export-cv.mjs sin dependencias; `node --test test/export-cv.test.mjs` → pass 11. Ajuste tras TASK-64: los saltos de línea simples se mantienen (<br>), 2026-11-06.
- [x] TASK-62 — 🔴 **Test: avisos** — si el contenido estimado pasa de una página, avisa; sin `pandoc` en el PATH, no hay DOCX y se avisa de qué falta (sin fallar); con pandoc simulado, lo invoca. Verify: igual. Done when: falla. Evidence: 6 tests: estimateLines, aviso de más de una página, sin pandoc → docx null + aviso, pandoc simulado invocado con [input,-o,cv.docx], pandoc que falla = aviso, CLI exit 0/1. Rojo junto con TASK-60.
- [x] TASK-63 — 🟢 **Avisos + DOCX opcional** — Verify: `npm test`. Done when: exit 0. Evidence: Avisos + DOCX opcional en exportCv (findPandoc/run inyectables); pass 11; con pandoc real de esta máquina generó cv.docx, 2026-11-06.
- [x] TASK-64 — 🔗 **Manual:** abrir `cv.html` de ejemplo en Chrome → Imprimir → Guardar como PDF. Done when: 1 página y legible. Evidence: CV ficticio realista → cv.html → Chrome headless --print-to-pdf: 1 página, legible (revisado visualmente). Primer render juntaba título y contacto en una línea → corregido con <br>, reimpreso: 1 página, 2026-11-06.

---

## Fase 6 — Distribución, documentación y E2E

- [x] TASK-70 — 🔴 **Test: marketplaces** — `.agents/plugins/marketplace.json` y `.claude-plugin/marketplace.json` parsean, apuntan a `./plugins/dominicode-job-hunt` y los `plugin.json` tienen `name`, `version` y `skills` (en Codex). Verify: `node --test test/marketplace.test.mjs`. Done when: falla. Evidence: test/marketplace.test.mjs (3 tests) → pass 1 / fail 2 antes de crear los marketplaces, 2026-11-06.
- [x] TASK-71 — 🟢 **Marketplaces** — Verify: `npm test`. Done when: exit 0. Evidence: `.agents/plugins/marketplace.json` + `.claude-plugin/marketplace.json`: pass 3. Real: con codex-cli 0.166 y un CODEX_HOME temporal, `marketplace add` + `plugin add` → installed, enabled 0.1.0; el instalador desde la caché copió los 5 .toml. `claude plugin validate` del marketplace y del plugin → passed, 2026-11-06.
- [ ] TASK-72 — ⚙️ **README ES + EN, LICENSE (MIT)** — instalación en Codex (marketplace + `init` o instalador), Claude Code y AGENTS.md; aviso sobre las restricciones de LinkedIn; "nunca envía nada"; privacidad (`jobs/` en local y fuera de git). Verify: `node scripts/check-leaks.mjs README*.md` (créditos permitidos) + revisión del mantenedor. Done when: exit 0 y OK. Evidence: README.md (EN) + README.es.md + LICENSE MIT; `check-leaks` sobre README*, marketplaces, src y plugins → limpio (se permiten `bezael/dominicode-job-hunt` y `owner` del marketplace, con tests). Falta la revisión del mantenedor.
- [x] TASK-73 — 🔗 **E2E Codex (flujo instalar + init + perfil + aplicar)** — en una carpeta temporal: añadir el marketplace local, instalar el plugin, `init` con CV ficticio, `perfil`, crear una oferta ficticia y `aplicar`. Incluye las rutas de error: volver a ejecutar `init` no borra nada; `aplicar` sin perfil lanza `perfil` antes. Done when: todos los ficheros esperados existen y no hay ningún envío. Evidence: codex-cli 0.166. Instalación: marketplace local + `plugin add` + instalador en un CODEX_HOME temporal (TASK-71). Flujo: skill en `.agents/skills/` de una carpeta temporal con `codex exec`: search sin criterios → propone init; init → 5 ficheros, sin instalar agentes; profile → 3 ficheros con [PENDING]; apply → 7 ficheros (cv.md/html/docx…), application_ready, status sin cambiar, nada enviado. Init repetido (en Claude, mismo SKILL.md): hashes idénticos. Apply sin perfil: ver TASK-74, 2026-11-06.
- [x] TASK-74 — 🔗 **E2E Claude Code** — `claude --plugin-dir <ruta>/plugins/dominicode-job-hunt` con el mismo guion. Done when: igual que TASK-73. Evidence: `claude -p --plugin-dir …/plugins/dominicode-job-hunt` en carpeta temporal: init (criteria + plantillas), init otra vez → mismos md5, profile (investigó 8 ofertas, detectó email de ejemplo, años incoherentes y país), apply con oferta ficticia → 7 ficheros, nada enviado; `aplicar` sin perfil → ejecutó profile primero y luego la candidatura (respondió en castellano). Hallazgo corregido: el rango salarial pedía menos que la banda publicada, 2026-11-06.
- [x] TASK-75 — 🔗 **E2E modo sin agentes** — Codex sin los `.toml` instalados: `perfil` y `priorizar` funcionan siguiendo `single-agent.md`. Done when: salidas equivalentes y una sola advertencia. Evidence: Codex sin `job-*` en ~/.codex/agents: init/profile/search/rank/apply/status funcionan siguiendo single-agent.md. Hallazgo: no decía la línea de capacidades → regla 8 en SKILL.md; re-ejecutado `status`: primera línea "Agents: no · Browser: … · Parallel: no. I'll handle the roles myself", una sola vez, 2026-11-06.
- [ ] TASK-76 — 🔗 **E2E `buscar` sin navegador y con navegador** — sin navegador: solo boards, fichas creadas, ninguna inventada. Con LinkedIn sin sesión: se para la parte de LinkedIn y se avisa. Sin `criterios.md`: propone `init`. Done when: los tres casos se comportan así. Evidence: Sin criterios → propone init ✔. Sin navegador → solo boards/web: 1 oferta real (URL 200, citas literales), ninguna inventada; salario no publicado → bloque 0 sin inventar estimación ✔. Hallazgo corregido: dejó `jobs/search-data/` → regla en job-scout. PENDIENTE: el caso con navegador y LinkedIn sin sesión necesita tu Chrome real.
- [ ] TASK-77 — 👤 **Comparación de calidad** — la misma oferta, `aplicar` con el sistema original y con el paquete (CV ficticio frente al real no es comparable: el mantenedor juzga estructura y criterio, no el contenido). Done when: el mantenedor considera que el paquete no pierde calidad. Evidence: —

---

## Fase 7 — Cierre

- [x] TASK-80 — **Code review** contra spec, plan y tasks y el diff real (`references/code-review.md`), con veredicto de alineación. Done when: sin bloqueantes y veredicto `Exact`. Evidence: Revisión independiente (subagente sin mi lectura): veredicto Minor drift, 0 bloqueantes en lo que se distribuye; 1 bloqueante de publicación (historial y specs/ con nombre y patrones públicos → TASK-82). Corregidos: main por realpath (symlink/junction, con test), instalador actualiza sus propios .toml y sale con 2 si salta alguno, clave de trust por SO, estados closed vs discarded y transiciones completas, apply con override, stale_after_days y edad con fallback a found, <skill>/references en los 5 roles, entrevistador solo web pública, tracker en apply paralelo, last_search, typing permitido solo en el buscador, detector (credits sin cerrar, author solo en JSON, rutas C:/ y /home, ficheros sin extensión, README y marketplaces en el build), export-cv --out/--paper. 4 tests nuevos de contrato. Pendiente aceptado: agentes con navegador heredan herramientas (documentado en README). npm test → pass 80, 2026-11-06.
- [ ] TASK-81 — **Final Verify** — `npm test` en limpio, CI en verde, matriz sin huérfanas, E2E 73–76 vigentes. Done when: todo PASS. Evidence: Clon limpio + `npm ci` + `npm test` sin lista privada → pass 80, in sync (29); CI run 42297955237 → success (Node 20 y 22) en 0f4d84e; `check-leaks .` con la lista privada → 0 términos privados. E2E 73–75 vigentes (re-ejecutados tras los cambios de rol solo en `status`). Abierta hasta cerrar TASK-76 (caso con navegador), 2026-11-06.
- [x] TASK-82 — 👤 **Publicar** — antes de hacerlo público: `node scripts/check-leaks.mjs .` con la lista privada sobre **todo** el repo (specs incluidas) y publicar con un **historial nuevo** (un solo commit inicial), porque `019d16c` nombra empresas reales. Después el mantenedor aprueba hacer público el repo (`gh repo edit --visibility public`) y la etiqueta `v1.0.0`. Done when: repo público e instalable desde los dos marketplaces. Evidence: repo nuevo y público bezael/dominicode-job-hunt con un solo commit (el historial de desarrollo queda en un repo privado aparte, renombrado); check-leaks sobre todo el repo con la lista privada: 0 términos privados (solo LICENSE y los propios patrones); specs/ entra en el escaneo del build; CI verde; v1.0.0 con release; instalación real desde GitHub con un CODEX_HOME temporal → plugin instalado, 2026-11-07

---

## Matriz de cobertura

| Funcionalidad (spec §3) | Contrato (plan) | Tareas |
|---|---|---|
| Instalar en Codex como plugin o skill | marketplace Codex + `.codex-plugin` | 20–21, 70–71, 73 |
| Instalar agentes en Codex (instalador) | `install-codex-agents.mjs` + `init` | 40–45, 52–53, 73 |
| Instalar en Claude Code | `.claude-plugin` + marketplace | 24–25, 70–71, 74 |
| Usar con AGENTS.md | copia `AGENTS.md` | 26–27 |
| Todo funciona sin agentes propios | `single-agent.md` | 50–51, 75 |
| `init` crea `jobs/` y entrevista criterios | `templates/jobs` + sección `init` | 52–53, 73 |
| Pegar CV en `cv-fuente.md` | plantilla `perfil/README.md` | 52–53, 73 |
| `init` repetible sin perder datos | reglas de `init` | 52–53, 73 |
| Criterios leídos de `criterios.md`, nunca fijos | entidad Criterios | 54–59 |
| Perfil + `[PENDIENTE]` | rol `job-profile` | 55, 73 |
| Buscar hoy/semana, desde los criterios | rol `job-scout` | 56, 76 |
| Navegador agnóstico + comprobar sesión | `browser.md` | 50–51, 56, 76 |
| Boards con API / sin navegador | rol `job-scout` | 56, 76 |
| Fichas con score + tracker | entidad Oferta + Tracker | 56, 76 |
| Priorizar (lista corta, cierre de más de 30 días) | rol `job-rank` + entidad Priorización | 57, 75 |
| Paralelo si se puede, secuencial si no | rama en `SKILL.md` | 51, 57, 75 |
| Cierres solo con OK del usuario | rol `job-rank` | 57 |
| Preparar candidatura | rol `job-application` | 58, 73, 77 |
| Exportar CV | `export-cv.mjs` | 60–64 |
| Nunca enviar / marcar `aplicada` al confirmar | `SKILL.md` + rol | 51, 58, 73 |
| Entrevistas por tipo + STAR + negociación | rol `job-interview` | 59 |
| Post-mortem | rol `job-interview` | 59 |
| Follow-ups y notas de agradecimiento (sin enviar) | `seguimiento` en `SKILL.md` | 51 |
| Pipeline, caducadas, métricas | `estado` en `SKILL.md` | 51 |
| Siguiente paso sin argumento | `SKILL.md` | 51 |
| Fuente única → 3 salidas | `build.mjs` | 20–32 |
| Bloqueo por datos personales | `check-leaks.mjs` + build | 10–13, 28–29 |
| Validar YAML y TOML | `build.mjs` | 20–23 |

**Flujos de la spec §4 (rutas de error):** `jobs/` existente → 53, 73 · Codex sin agentes → 75 · login/captcha → 56, 76 · sin `criterios.md` → 51, 76 · sin perfil → 58, 73 · sin herramientas de exportación → 62–63 · oferta no comprobable → 57 · fuga/manifiesto inválido → 22–23, 28–29.

**NFR medibles:** máx. 25 fichas por tanda → 56 · sin datos del mantenedor → 10–13, 28–29, 81 · `jobs/` fuera de git → 04, 52 · Codex ≥ 0.166 + Claude Code → 73–74 · modo degradado → 75–76.

Sin funcionalidades huérfanas.
