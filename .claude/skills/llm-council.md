# Skill: LLM Council — Consejo de Decisión Multi-Agente

## Cuándo aplicar este skill
Cuando el usuario pida explícitamente una decisión difícil, ambigua o de alto impacto y quiera varias perspectivas antes de decidir. Frases gatillo: "consulta al consejo", "council this", "debate esto", "dame varias perspectivas", "pressure-test this", "¿qué opciones tengo aquí?" para decisiones de arquitectura, producto, negocio o priorización — **no** para preguntas triviales o de sintaxis, donde una respuesta directa es más rápida y barata.

## Origen
Basado en el proyecto open-source **LLM Council** de Andrej Karpathy ([github.com/karpathy/llm-council](https://github.com/karpathy/llm-council)). El original consulta a varios proveedores de LLM (GPT, Gemini, Claude, Grok) vía OpenRouter, hace que se revisen entre sí de forma anónima, y un "Chairman" sintetiza la respuesta final.

Adaptación para Claude Code (sin infraestructura multi-proveedor): en vez de distintos LLMs, se lanzan **5 subagentes en paralelo vía la herramienta Agent**, cada uno con una persona/ángulo de pensamiento distinto. El "Chairman" es el propio asistente principal, que sintetiza los 5 resultados.

---

## Flujo (4 fases)

### Fase 1 — Encuadre neutral
Reformular la pregunta del usuario en términos neutrales, sin filtrar por una opción preferida, antes de repartirla a los agentes.

### Fase 2 — Generación paralela (5 personas)
Lanzar 5 agentes con el Agent tool **en un solo mensaje** (llamadas paralelas), cada uno con un prompt de persona distinto pero la misma pregunta de base y el mismo contexto del proyecto:

| Persona | Enfoque |
|---|---|
| **El Contrarian** | Busca activamente por qué esta idea podría fallar; identifica los riesgos que nadie quiere mencionar |
| **Pensador de Primeros Principios** | Cuestiona si el problema está bien planteado antes de aceptar las opciones dadas |
| **El Expansionista** | Busca el upside y oportunidades que la pregunta original no contempló |
| **El Outsider** | Responde sin asumir contexto previo del proyecto — mirada fresca, ingenua a propósito |
| **El Ejecutor** | 100% práctico: qué se puede hacer hoy mismo, ignorando lo especulativo |

Usar `subagent_type: general-purpose` para los 5, variando solo el prompt de persona. Cada prompt debe incluir la pregunta original, el contexto relevante del proyecto, y una instrucción explícita de mantener esa persona durante todo el análisis.

### Fase 3 — Revisión cruzada (opcional, solo para decisiones muy críticas)
Si la decisión lo amerita, pasar las 5 respuestas (anonimizadas, sin decir qué persona dijo qué) de vuelta a cada agente para que reaccione a los otros puntos de vista antes de la síntesis final. Para la mayoría de los casos, esta fase se puede omitir e ir directo a la Fase 4.

### Fase 4 — Síntesis del Chairman
El asistente principal (no un subagente más) integra las 5 respuestas y entrega:
- **Consensos** — en qué coinciden las 5 perspectivas
- **Desacuerdos** — dónde chocan y por qué
- **Puntos ciegos** — riesgos u oportunidades que solo 1 de las 5 vio
- **Recomendación concreta** — una acción clara a seguir, no una lista de opciones sin decidir

---

## Notas de costo
Lanzar 5 agentes en paralelo consume recursos reales — reservar este skill para decisiones de peso (arquitectura, elección de proveedor/stack, prioridades de producto, decisiones de negocio), no para dudas menores de una línea de código.

## Formato de salida
Responder en texto estructurado con las secciones de la Fase 4. Si el usuario pide "verlo bonito" o comparar las 5 posturas lado a lado, usar el tool Artifact para una tabla comparativa en vez de HTML plano.
