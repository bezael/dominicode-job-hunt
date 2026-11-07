# Specs Index — dominicode-job-hunt

> Memoria del proyecto (SDD). Se versiona en git; `specs/**/.work/` no.

## Decisiones compartidas

| Decisión | Valor | Motivo (1 línea) | Decidido en |
|---|---|---|---|
| Runtime de scripts | Node ≥ 20, ESM, sin dependencias en runtime | lo tiene cualquiera que use Codex o Claude Code | `dominicode-job-hunt` |
| Test runner | `node --test` | integrado en Node, sin dependencias | `dominicode-job-hunt` |
| Idioma de las instrucciones | inglés; la conversación sigue el idioma del usuario; README ES + EN | los modelos lo siguen mejor y amplía el alcance | `dominicode-job-hunt` |
| Fuente única | `src/` → build → `plugins/` (versionado) + `AGENTS.md` | los marketplaces instalan desde git; CI comprueba la sincronía | `dominicode-job-hunt` |
| Agentes en Codex | instalador o `init` copian los `.toml`; los plugins aún no pueden incluir agentes | openai/codex#18988 sigue abierta (2026-11-06) | `dominicode-job-hunt` |
| Distribución | gratis, MIT, repo público tras pasar el detector | lead magnet del autor | `dominicode-job-hunt` |
| Seguridad | nunca enviar candidaturas ni mensajes; el navegador solo lee | evita bloqueos y es decisión del usuario | `dominicode-job-hunt` |

## Specs

| Slug | Visión (1 línea) | Estado | Stack clave | Relacionadas |
|---|---|---|---|---|
| `dominicode-job-hunt` | Skill + 5 agentes de búsqueda de empleo remoto para Codex, Claude Code y AGENTS.md, configurables y sin datos personales | in progress | Node + Markdown | — |
