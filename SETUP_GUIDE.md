# Synkrise — Guía de Archivos para Claude Code

## Estructura de archivos de configuración

```
synkrise-app/
├── CLAUDE.md                        ← Claude lo lee SIEMPRE al iniciar
└── .claude/
    └── skills/
        ├── animations.md            ← Leer al crear/modificar cualquier animación
        ├── design.md                ← Leer al crear/modificar cualquier componente visual
        └── data-ai.md               ← Leer al implementar Excel import o IA Insights
```

---

## Cómo instalar estos archivos (paso a paso)

### Paso 1 — Crear el proyecto en tu computadora
```bash
npx create-next-app@latest synkrise-app --typescript --tailwind --app
cd synkrise-app
```

### Paso 2 — Copiar los archivos de configuración
Copia `CLAUDE.md` en la raíz del proyecto (`synkrise-app/CLAUDE.md`).
Crea la carpeta `.claude/skills/` y copia los tres archivos de skills dentro.

### Paso 3 — Abrir Claude Code
```bash
claude
```
Claude Code leerá `CLAUDE.md` automáticamente al iniciar.

### Paso 4 — Instalar el skill de animaciones de Emil Kowalski (versión externa)
```bash
npx skills add https://github.com/delphi-ai/animate-skill --skill animate
```
Este skill complementa el `.claude/skills/animations.md` local con ejemplos adicionales.

---

## Cómo usar los skills en Claude Code

Los skills se activan diciéndole a Claude Code que los lea antes de ejecutar una tarea.

### Patrón de prompt recomendado por sesión:

**Sesión de UI / Componentes:**
```
Lee @.claude/skills/design.md y @.claude/skills/animations.md antes de continuar.
Luego: [tu instrucción aquí]
```

**Sesión de Excel / IA:**
```
Lee @.claude/skills/data-ai.md antes de continuar.
Luego: [tu instrucción aquí]
```

**Sesión de dashboard completo:**
```
Lee @.claude/skills/design.md, @.claude/skills/animations.md y @.claude/skills/data-ai.md.
Luego: [tu instrucción aquí]
```

---

## Orden de lectura que Claude Code sigue

```
1. CLAUDE.md              → siempre, automático al iniciar sesión
2. skills/design.md       → cuando creas componentes visuales
3. skills/animations.md   → cuando hay interacciones/transiciones
4. skills/data-ai.md      → cuando hay Excel o IA
```

Los skills NO se cargan automáticamente — debes pedirle a Claude Code que los lea con `@ruta/al/archivo`.

---

## Comandos útiles dentro de Claude Code

```
/clear          → Limpiar contexto cuando la sesión se pone lenta
/status         → Ver cuánto contexto estás usando
/compact        → Comprimir contexto sin perderlo
/rewind         → Volver a un estado anterior si algo salió mal

# Al empezar cada sesión nueva:
> Lee @CLAUDE.md y dime en qué fase del proyecto estamos.
```

---

## Regla de oro para cada sesión

Cada vez que abras Claude Code para trabajar en Synkrise, empieza con:

```
Lee @CLAUDE.md. 
El proyecto está en [FASE X — ej: Fase 4, Dashboard Base].
Hoy vamos a implementar: [describe exactamente qué].
Lee los skills necesarios antes de empezar.
```

Esto garantiza que Claude Code tenga contexto completo desde el primer mensaje.
