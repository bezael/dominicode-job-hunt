# Spec — dominicode-job-hunt

> Plantilla Spec-First. Contexto: **ALTO** (conversación del 2026-11-06 + un sistema privado ya en uso).

## Source

```yaml
source:
  type: existing-system
  repository: privado (una skill y cinco agentes escritos para una sola persona)
  decided_with: el mantenedor, 2026-11-06 — producto/lead magnet (opción 2), prioridad Codex, nombre dominicode-job-hunt
```

El sistema original funciona, pero está escrito para una sola persona: decenas de referencias a su autor, un perfil de navegador con su nombre, su stack y su salario fijos en los prompts, ficheros de su carpeta de marca y un script de exportación dentro de una candidatura concreta. Esta spec describe la versión que puede usar cualquier developer.

---

## SECCIÓN 1 — Visión

Un paquete de una skill y cinco agentes que convierte Codex (y también Claude Code u otro agente compatible con AGENTS.md) en un asistente de búsqueda de empleo remoto para developers: encuentra y puntúa ofertas, prepara candidaturas y entrevistas, y hace el seguimiento a partir de la configuración y el CV de cada persona, sin enviar nunca nada en su nombre.

---

## SECCIÓN 2 — Usuarios y casos de uso

**Usuario candidato (developer que busca trabajo remoto):** instala el paquete en Codex o Claude Code, configura sus criterios y su CV una vez con `init`, y cada día busca ofertas, prepara candidaturas y entrevistas y lleva el seguimiento.

**Agente anfitrión (Codex, Claude Code, Cursor/Gemini vía AGENTS.md):** lee la skill, decide qué subcomando ejecutar, lanza los agentes especializados (o hace su trabajo él mismo si la herramienta no permite agentes propios) y escribe en la carpeta `jobs/` del usuario.

**Usuario mantenedor:** edita el contenido en un único formato fuente, genera las salidas por herramienta con un build, comprueba que no se cuela ningún dato personal y publica versiones.

---

## SECCIÓN 3 — Funcionalidades

**Módulo Instalación y distribución:**
- El usuario puede instalar el paquete en Codex como plugin (`codex plugin add` desde el marketplace del repo) o copiando la skill a `~/.codex/skills/`.
- El usuario puede instalar los agentes en Codex con un instalador que copia los `.toml` a `~/.codex/agents/` (global) o a `.codex/agents/` (proyecto). Hace falta un instalador porque los plugins de Codex todavía no pueden incluir agentes (openai/codex#18988 sigue abierta a 2026-11-06). Cuando lo permitan, los agentes pasarán al plugin.
- El usuario puede instalar el paquete en Claude Code como plugin (`.claude-plugin/plugin.json` con la skill y los agentes).
- El usuario puede usarlo en Cursor, Gemini CLI u otra herramienta compatible con AGENTS.md mediante un `AGENTS.md` equivalente a la skill.
- El sistema permite usar todos los subcomandos aunque la herramienta no tenga agentes propios: la skill incluye las instrucciones de cada rol y el agente anfitrión las ejecuta él mismo.

**Módulo Configuración (`init`):**
- El usuario puede ejecutar `init` para crear `jobs/` con `criterios.md`, `tracker.md`, `perfil/README.md` y las carpetas `ofertas/`, `aplicaciones/` y `entrevistas/`.
- El usuario puede definir en una entrevista guiada su rol objetivo (cualquier rol de desarrollo, no solo frontend), stack, seniority, salario mínimo y moneda, modalidad, país desde el que se le contrata, zonas horarias aceptadas, idiomas y exclusiones.
- El usuario puede pegar su CV o el texto exportado de su perfil de LinkedIn en `jobs/perfil/cv-fuente.md`.
- El sistema permite volver a ejecutar `init` sin perder datos: solo crea lo que falta y propone cambios en `criterios.md` en vez de sobrescribirlo.
- El sistema lee `criterios.md` y el perfil al arrancar cada subcomando. Ningún criterio del usuario vive dentro de los prompts.

**Módulo Perfil (`perfil`):**
- El usuario puede generar `candidato.md`, un CV base en inglés listo para ATS y los textos de LinkedIn (headline, about, experiencia, skills) a partir de su CV real.
- El sistema marca como `[PENDIENTE: …]` cualquier dato que no esté respaldado por el CV, en lugar de inventarlo.

**Módulo Búsqueda (`buscar`):**
- El usuario puede buscar ofertas de las últimas 24 h o de la última semana.
- El sistema construye las búsquedas de LinkedIn a partir de `criterios.md` (palabras clave, seniority, remoto, fecha), no de una URL fija.
- El sistema usa el navegador que tenga conectado la herramienta (Claude in Chrome, el navegador de Codex u otro) y comprueba que hay sesión iniciada en LinkedIn antes de buscar.
- El sistema busca también en boards con API pública que no necesitan sesión (por ejemplo RemoteOK) y, si no hay navegador, usa solo esos.
- El sistema crea una ficha por oferta en `jobs/ofertas/` con score, evidencia y motivo, descarta las que incumplen un criterio innegociable y actualiza `tracker.md`.

**Módulo Priorización (`priorizar`):**
- El usuario puede volver a puntuar todas las ofertas pendientes y recibir la lista corta de la semana (N = 5 por defecto).
- El sistema cierra directamente las ofertas de más de 30 días y reparte el resto en lotes para el agente de ranking, en paralelo si la herramienta lo permite y una detrás de otra si no.
- El sistema propone cierres, pero solo cambia el `status` de una ficha cuando el usuario lo aprueba.

**Módulo Candidatura (`aplicar`):**
- El usuario puede preparar para una oferta concreta el CV adaptado, la carta de presentación, el mensaje al recruiter, las respuestas del formulario y un checklist de envío.
- El usuario puede exportar el CV adaptado a PDF y DOCX con el script del paquete.
- El sistema nunca pulsa "Apply" ni envía mensajes. Cuando el usuario confirma que ha aplicado, marca la ficha como `aplicada` y actualiza el tracker.

**Módulo Entrevistas (`entrevista`):**
- El usuario puede preparar una entrevista por tipo (`screening | tecnica | live-coding | system-design | cultural | final | negociacion`) o el paquete completo.
- El sistema genera preguntas técnicas según el stack de la oferta y del candidato, respuestas STAR basadas solo en su experiencia real y un guion de negociación a partir de su salario objetivo.
- El usuario puede añadir un post-mortem que alimenta la preparación de la siguiente entrevista.

**Módulo Seguimiento (`seguimiento`, `estado`, sin argumento):**
- El usuario puede generar los follow-ups vencidos (máximo 2 por candidatura) y las notas de agradecimiento después de cada entrevista. Se redactan pero nunca se envían.
- El usuario puede ver el pipeline, las ofertas caducadas, las métricas de la semana y la siguiente acción recomendada.
- El sistema decide el siguiente paso lógico cuando se invoca sin argumento.

**Módulo Build y calidad (mantenedor):**
- El mantenedor puede editar la skill y los agentes en un único formato fuente y generar con un comando las salidas de Codex, Claude Code y AGENTS.md.
- El sistema bloquea el build si encuentra datos personales del mantenedor (nombre fuera de los créditos, rutas absolutas de su máquina, el nombre de su perfil de navegador, referencias a su carpeta de marca, empresas o personas de procesos reales).
- El sistema valida que el frontmatter de cada `SKILL.md` es YAML estricto y que cada `.toml` de Codex se puede parsear.

---

## SECCIÓN 4 — Flujos

**Flujo — Instalar en Codex y configurar:**
1. El usuario añade el marketplace del repo e instala el plugin, o ejecuta el instalador.
2. El sistema deja la skill en Codex y los agentes en `~/.codex/agents/` o en `.codex/agents/`.
3. El usuario abre Codex en una carpeta de trabajo y pide `init`.
4. El sistema hace las preguntas de criterios, crea `jobs/` y pide el CV.
5. El usuario pega su CV en `jobs/perfil/cv-fuente.md` y el sistema le propone ejecutar `perfil`.
- **Error:** si la carpeta ya tiene un `jobs/` con datos, el sistema no sobrescribe nada: lista lo que falta, lo crea y propone un diff de `criterios.md`.
- **Error:** si la versión de Codex no carga agentes propios, el sistema lo dice una vez y sigue en modo "un solo agente" con las instrucciones de cada rol incluidas en la skill.

**Flujo — Buscar ofertas:**
1. El usuario pide `buscar hoy`.
2. El sistema lee `criterios.md`, detecta si hay un navegador conectado y comprueba la sesión de LinkedIn.
3. El sistema busca en LinkedIn y en los boards con API, filtra por innegociables y puntúa.
4. El sistema crea las fichas y actualiza el tracker, y propone `aplicar` sobre la de mayor score.
- **Error:** si LinkedIn pide login o muestra un captcha, el sistema para la parte de LinkedIn, lo avisa y continúa solo con los boards. No intenta saltarse el captcha.
- **Error:** si no hay `criterios.md`, el sistema no busca y propone `init`.

**Flujo — Preparar una candidatura:**
1. El usuario pide `aplicar <empresa>`.
2. El sistema resuelve la oferta (pregunta si hay más de una coincidencia) y comprueba que existen `candidato.md` y el CV base.
3. El sistema genera los materiales en `jobs/aplicaciones/<slug>/` y exporta el CV.
4. El usuario envía la candidatura por su cuenta y lo confirma, y el sistema actualiza la ficha y el tracker.
- **Error:** si falta el perfil, el sistema ejecuta antes `perfil` (o pide el CV si tampoco existe `cv-fuente.md`).
- **Error:** si las herramientas de exportación no están instaladas, el sistema entrega el CV en Markdown y HTML, dice qué falta para el PDF y DOCX y no da la candidatura por incompleta.

**Flujo — Priorizar:**
1. El usuario pide `priorizar`.
2. El sistema cierra directamente las ofertas de más de 30 días y reparte el resto en lotes.
3. El sistema lanza los agentes de ranking (en paralelo si se puede) y escribe `jobs/priorizacion-YYYY-MM-DD.md`.
4. El usuario aprueba los cierres y el sistema actualiza solo esas fichas.
- **Error:** si una oferta no se puede comprobar (la página no carga o pide login), queda como `verificada: no` con el motivo. No se cierra.

**Flujo — Publicar una versión (mantenedor):**
1. El mantenedor edita la fuente y ejecuta el build.
2. El sistema genera las salidas de Codex, Claude Code y AGENTS.md, valida YAML/TOML y pasa el detector de datos personales.
3. El mantenedor prueba una sesión con un CV ficticio en Codex y en Claude Code y publica la versión.
- **Error:** si el detector encuentra un dato personal o un manifiesto no valida, el build termina con código distinto de 0, indicando el fichero y la línea, y no genera salidas.

---

## SECCIÓN 5 — Arquitectura

**Arquitectura propuesta (se cierra en `plan.md`):**

- **Tipo:** paquete de contenido (Markdown + manifiestos), sin backend ni base de datos. El estado del usuario son ficheros Markdown en su `jobs/`.
- **Fuente única:** `src/skill/` (SKILL.md + referencias por rol) y `src/agents/*.md` con un frontmatter neutro (`name`, `description`, `tools` lógicas). Las instrucciones no nombran herramientas concretas como `mcp__claude-in-chrome__*`, sino capacidades ("navegador conectado", "lanzar agente").
- **Build:** script en **Node** (decidido el 2026-11-06) que genera `dist/codex/` (skill, `agents/*.toml`, `.codex-plugin/plugin.json`), `dist/claude/` (`.claude-plugin/plugin.json`, `skills/`, `agents/`) y `AGENTS.md`.
- **Exportación del CV:** **HTML imprimible** (decidido el 2026-11-06). Se genera un HTML con estilos de impresión de una página que el usuario guarda como PDF desde el navegador, sin dependencias. DOCX opcional solo si el usuario tiene pandoc.
- **Distribución:** repo de GitHub con marketplace de Codex y de Claude Code en la raíz.
- **Integraciones:** LinkedIn a través del navegador del usuario (solo lectura) y boards con API pública.

---

## SECCIÓN 6 — Requisitos no funcionales

- **Rendimiento:** `init` completo en menos de 5 minutos de interacción. `buscar hoy` termina en una sola sesión sin agotar el contexto: máximo 25 fichas por tanda.
- **Seguridad y ética:** ni el paquete ni sus instrucciones envían candidaturas o mensajes, ni pulsan "Apply". El navegador solo lee. Ante un captcha o login, se para. El README avisa del riesgo de restricción de cuenta en LinkedIn por uso automatizado.
- **Privacidad:** todo vive en local, en el `jobs/` del usuario. No hay telemetría ni llamadas a servicios propios. La plantilla de `.gitignore` excluye `jobs/` para que el CV no acabe en un repo público por error. El paquete no contiene ningún dato del mantenedor (lo garantiza el detector del build).
- **Veracidad:** ningún material inventa experiencia, cifras ni empresas. Lo que no está en el CV se marca `[PENDIENTE]`.
- **Compatibilidad:** Codex CLI ≥ 0.166 (versión probada) y Claude Code actual. Windows, macOS y Linux. El modo degradado sin agentes ni navegador tiene que funcionar.
- **Escalabilidad:** sin estado compartido. Funciona igual con 10 que con 500 fichas, gracias a que `priorizar` trabaja por lotes.
- **Idioma:** la conversación sigue el idioma del usuario. CV, cartas y mensajes van en el idioma de la oferta (inglés por defecto). Las instrucciones de la skill y los agentes van en **inglés**. README en castellano y en inglés (decidido el 2026-11-06).
- **Accesibilidad:** no aplica (no hay interfaz propia).
- **Licencia y marca:** créditos del autor en el README y en los manifiestos, nunca dentro de las instrucciones de trabajo.

---

## Preguntas abiertas

- [x] ¿Puede un plugin de Codex incluir agentes? **No.** Los agentes se definen en `~/.codex/agents/` o en `.codex/agents/` ([doc oficial de subagentes](https://developers.openai.com/codex/subagents)), y la petición de añadirlos a los plugins sigue abierta ([openai/codex#18988](https://github.com/openai/codex/issues/18988)). Habrá un instalador — agente, 2026-11-06
- [x] Idioma de las instrucciones y del README: inglés, y README bilingüe — 2026-11-06
- [x] Runtime del build: Node — 2026-11-06
- [x] Exportación del CV: HTML imprimible, y DOCX opcional con pandoc — 2026-11-06
- [x] Modelo de distribución: **gratis** — 2026-11-06. El repo pasa a público cuando la v1 supere el detector de datos personales
- [x] Licencia: MIT — confirmada junto con el plan, 2026-11-06
- [ ] Interview Room (simulacro con voz) como módulo de la v2 — responsable: el mantenedor, después de la v1 (fuera de alcance)
- [x] Repo en GitHub: creado como privado, https://github.com/bezael/dominicode-job-hunt — 2026-11-06

## Fuera de alcance (v1)

- Enviar candidaturas o mensajes por cualquier vía.
- Interview Room y cualquier componente con servidor o clave de API.
- Las ofertas, candidaturas y entrevistas reales de `companyAgents/jobs/`. Ninguna se copia, ni como ejemplo.
