# dominicode-job-hunt

[English](README.md) · **Español**

Tu búsqueda de trabajo, llevada por tu agente de código: remoto, híbrido o presencial, como tú elijas. Escribes una vez qué buscas; el agente encuentra ofertas, las puntúa contra tus criterios, prepara una candidatura a medida para las que merecen la pena, te prepara las entrevistas y te recuerda hacer seguimiento.

Funciona en **Codex**, **Claude Code** y cualquier herramienta que lea **`AGENTS.md`**. Gratis, con licencia MIT.

> **Nunca envía nada.** Ni candidaturas, ni mensajes, ni solicitudes de conexión. Prepara; tú decides y envías.

## Qué incluye

| Comando | Qué hace |
|---|---|
| `init` | Crea `jobs/` y te pregunta tus criterios: puestos, stack, salario mínimo, remoto/híbrido/presencial y ciudades, desde qué país te pueden contratar, tipos de contrato, zonas horarias y exclusiones |
| `perfil` | Convierte tu CV en un perfil de candidato, un CV base de una página y los textos de LinkedIn pensados para recruiters. Lo que falta vuelve como `[PENDING]`; nunca se inventa |
| `buscar [today\|week]` | Busca ofertas en las modalidades y ciudades que elegiste, en LinkedIn (solo lectura, con tu propia sesión del navegador, si tu agente tiene uno) y en boards públicos (RemoteOK, Remotive y Himalayas para remoto; Arbeitnow para presencial en Alemania y Europa). Un fichero por oferta, con su puntuación y las pruebas que la justifican |
| `priorizar [N]` | Vuelve a mirar las ofertas pendientes (¿siguen abiertas?, ¿siguen encajando?) y te da la lista corta de la semana. No cierra nada sin tu OK |
| `aplicar <oferta>` | CV adaptado (Markdown + HTML imprimible, y DOCX si tienes pandoc), carta breve, mensaje al recruiter, respuestas del formulario y checklist de envío |
| `entrevista <oferta> [tipo]` | Investigación de la empresa, preguntas técnicas probables del stack de la oferta, live coding, system design, respuestas STAR con tus historias reales, preguntas que hacer y guion de negociación |
| `seguimiento` | Redacta los seguimientos que tocan y las notas de agradecimiento después de las entrevistas |
| `estado` | Pipeline, seguimientos pendientes, ofertas estancadas y métricas de la semana |

Los comandos también funcionan en inglés: `profile`, `search`, `rank`, `apply`, `interview`, `follow-up`, `status`. Los ficheros que crea tienen nombres en inglés (`criteria.md`, `offers/`…); el agente te habla en tu idioma.

## Instalación

Necesitas Node 20 o superior para los scripts (exportar el CV e instalar los agentes en Codex). Nada más.

### Codex

```bash
codex plugin marketplace add bezael/dominicode-job-hunt
codex plugin add dominicode-job-hunt@dominicode-job-hunt
```

Después, en la carpeta de tu búsqueda, abre Codex y escribe `$job-hunt init` (o pídelo sin más: "prepara mi búsqueda de trabajo").

Los plugins de Codex todavía no pueden incluir agentes, así que `init` te ofrece instalar los cinco agentes `job-*` en `~/.codex/agents/`: te pregunta antes, nunca sobrescribe un fichero tuyo y luego reinicias Codex. Si dices que no, todo sigue funcionando: el agente principal hace cada papel él mismo.

Sin el sistema de plugins, copia la carpeta `plugins/dominicode-job-hunt/skills/job-hunt` de este repositorio en `~/.codex/skills/job-hunt` (o en `.agents/skills/job-hunt` dentro de la carpeta de tu búsqueda).

### Claude Code

```
/plugin marketplace add bezael/dominicode-job-hunt
/plugin install dominicode-job-hunt@dominicode-job-hunt
```

Después ejecuta `/dominicode-job-hunt:job-hunt init`, o pide "prepara mi búsqueda de trabajo".

### Cualquier herramienta que lea AGENTS.md

Copia [`plugins/dominicode-job-hunt/AGENTS.md`](plugins/dominicode-job-hunt/AGENTS.md) en la raíz de la carpeta de tu búsqueda (o añádelo al `AGENTS.md` que ya tengas). Lleva la skill, los cinco roles y las plantillas en un solo fichero. Para exportar el CV, clona este repositorio; el fichero explica dónde está el script.

### ChatGPT

El chat de ChatGPT no carga plugins ni guarda una carpeta `jobs/`, así que el paquete completo funciona en **Codex** (incluido en los planes de ChatGPT, con la misma cuenta; mira arriba). Para una versión reducida dentro de ChatGPT:

1. Crea un **Proyecto** (o un GPT personalizado) y sube [`plugins/dominicode-job-hunt/AGENTS.md`](plugins/dominicode-job-hunt/AGENTS.md) como archivo.
2. Añade esta instrucción: *"Sigue las instrucciones de AGENTS.md. Aquí no existen los ficheros de `jobs/`: yo te pego su contenido y tú me devuelves cada fichero que escribirías para que lo guarde yo."*
3. Pega tus criterios y tu CV, y usa `perfil`, `aplicar` (pegando el texto de la oferta) y `entrevista`.

Lo que pierdes: la búsqueda en LinkedIn con tu sesión del navegador, un tracker que se mantenga entre conversaciones (los ficheros los guardas tú) y la exportación del CV a HTML o DOCX (recibes el CV en Markdown).

## Primera vez

1. `init`: responde las preguntas (5 minutos). Tus criterios quedan en `jobs/criteria.md` y puedes editarlo cuando quieras.
2. Pega tu CV (o el texto del PDF que exporta LinkedIn) en `jobs/profile/cv-source.md`.
3. `perfil`, y aplica ese mismo día los tres cambios de LinkedIn que te proponga.
4. `buscar today` y `aplicar` a las una o dos mejores.

Un buen ritmo semanal: `seguimiento` y `buscar today` cada mañana, `priorizar` los lunes y `estado` los viernes.

## Privacidad

- Todo vive en una carpeta local `jobs/`, en Markdown. Un `jobs/.gitignore` la deja fuera de git, aunque esté dentro de un repositorio.
- Mientras trabaja, tu agente envía tu CV y las ofertas al proveedor de su modelo, como con cualquier otra cosa que hagas con él.
- El navegador solo se usa para leer. El paquete nunca pide contraseñas ni inicia sesión por ti.

## Sobre LinkedIn

Navegar de forma automatizada puede hacer que LinkedIn restrinja tu cuenta. El paquete lo mantiene pequeño y en solo lectura: como mucho 25 páginas de oferta por búsqueda y 10 por lote al priorizar, ningún clic que cambie nada, y se para en la primera pantalla de login o captcha para seguir solo con los boards públicos. Úsalo bajo tu responsabilidad; si lo prefieres, prescinde del navegador y usa solo los boards.

## Límites honestos

- La puntuación es tan buena como tus criterios. Lee las citas de cada oferta antes de aplicar.
- Los salarios estimados van marcados como estimados. Tómalos como una aproximación.
- LinkedIn y los boards cambian sus páginas a menudo. Cuando una fuente falla, el agente lo dice en vez de inventarse ofertas.
- "Nunca envía nada" es una regla escrita en todas las instrucciones, y los agentes que no usan el navegador solo reciben las herramientas que necesitan. Los que leen páginas con tu navegador (buscar y priorizar) reciben las herramientas de navegador que tenga tu agente, porque cada herramienta las llama de una forma. Si tienes conectadas herramientas que envían correos o mensajes, vigila lo que hacen, como con cualquier agente.

## Contribuir

Edita solo `src/` y ejecuta `npm test`. Todo lo que hay en `plugins/` lo genera `npm run build`. Las reglas para agentes que trabajen en este repositorio están en [`AGENTS.md`](AGENTS.md).

<!-- credits -->
---

Hecho por **Bezael Pérez · [Dominicode](https://dominicode.com)**: IA para developers, en español. Licencia MIT.
<!-- /credits -->
