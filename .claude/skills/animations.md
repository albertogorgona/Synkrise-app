# Skill: Animaciones — Principios de Emil Kowalski

## Cuándo aplicar este skill
Siempre que implementes: transiciones, hover states, modales, toasts, sidebars, loaders, page transitions, micro-interacciones, o cualquier movimiento en la UI.

---

## Filosofía central
> "Decide qué NO animar. Las mejores interfaces tienen pocas animaciones, pero cada una se siente intencional."
— Emil Kowalski (ex-Vercel, Linear)

**Para una herramienta de productividad como Synkrise**: restraint total. Velocidad > espectáculo. Cada animación debe tener un propósito funcional.

---

## Reglas de Timing

| Tipo de elemento | Duración |
|---|---|
| Micro-interacción (hover, click) | 100–150ms |
| Transición de componente (modal, dropdown) | 150–200ms |
| Page transition / layout shift | 200–300ms |
| Nunca más de | 300ms para UI de productividad |

**Regla de oro**: Si la animación se siente lenta, redúcela 50ms. Sigue haciéndolo hasta que se sienta rápida. Luego añade 20ms.

---

## Easing — Curvas recomendadas

```css
/* DEFAULT — para la mayoría de transiciones */
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);

/* ENTRADA de elementos */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);

/* SPRING — para gestos y elementos draggables */
/* Usar Framer Motion: type: "spring", stiffness: 400, damping: 30 */

/* iOS drawer — vaul style */
--ease-ios: cubic-bezier(0.32, 0.72, 0, 1);
```

**Regla**: Casi siempre `ease-out`. `ease-in` solo para elementos que salen de la pantalla. Linear = nunca en UI.

---

## Propiedades a animar (GPU-safe)

✅ **SÍ animar** — no generan layout:
- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (blur, brightness)

❌ **NO animar** — fuerzan layout reflow:
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `background-color` (preferir opacity sobre un pseudo-elemento)

```tsx
// ✅ CORRECTO
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
>

// ❌ INCORRECTO
<motion.div
  animate={{ height: '300px', marginTop: '20px' }}
>
```

---

## Patrones para Synkrise Dashboard

### KPI Cards — entrada escalonada
```tsx
// Cada card entra con un delay incremental
const kpiVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.2, ease: [0.0, 0.0, 0.2, 1] }
  })
}

// Uso:
{kpis.map((kpi, i) => (
  <motion.div key={kpi.id} custom={i} variants={kpiVariants}
    initial="hidden" animate="visible">
    <KPICard {...kpi} />
  </motion.div>
))}
```

### Sidebar navigation — active indicator
```tsx
// El indicador activo se mueve con layout animation
<motion.div
  layoutId="sidebar-active"
  className="absolute inset-0 bg-blue-500/20 rounded-lg"
  transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
/>
```

### Panel de Insights IA — slide-in lateral
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl"
    >
```

### Toasts / Notificaciones — usar Sonner
```tsx
// Instalar: npm install sonner
import { toast } from 'sonner'

// Éxito al importar Excel:
toast.success('Datos importados', {
  description: '312 filas procesadas correctamente'
})

// Error:
toast.error('Formato no reconocido', {
  description: 'Verifica que el archivo tenga columnas: Fecha, Producto, Ventas'
})
```

### Hover states en botones
```css
/* CSS puro — no necesitas Framer Motion para esto */
.btn-primary {
  transition: transform 100ms ease-out, box-shadow 100ms ease-out;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 111, 196, 0.3);
}
.btn-primary:active {
  transform: translateY(0);
  transition-duration: 50ms;
}
```

---

## Frecuencia de animaciones — Regla de Emil

| Frecuencia | Qué significa |
|---|---|
| **Alta** (cada interacción) | Solo hover + focus states en CSS |
| **Media** (algunas acciones) | Entrada de componentes nuevos, modales |
| **Baja** (momentos especiales) | Page load, imports exitosos, onboarding |

Para Synkrise: máximo 3–4 elementos animados visibles simultáneamente.

---

## Accesibilidad — OBLIGATORIO

```tsx
// SIEMPRE incluir en componentes con animación
import { useReducedMotion } from 'framer-motion'

function AnimatedCard() {
  const shouldReduce = useReducedMotion()
  
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduce ? 0 : 0.2,
        y: { type: shouldReduce ? 'tween' : 'spring' }
      }}
    />
  )
}
```

```css
/* En globals.css — siempre */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Instalación de dependencias

```bash
npm install framer-motion    # animaciones React
npm install sonner           # toasts
npm install vaul             # drawers/sheets móvil-first
```

---

## Anti-patrones — NUNCA hacer esto en Synkrise

- ❌ Bounce/elastic en elementos de datos — confunde al usuario
- ❌ Animaciones al hacer scroll en el dashboard — distrae del contenido
- ❌ Loading spinners animados en cada chart — usar skeleton estático
- ❌ Transiciones de página lentas (>300ms) — rompe la sensación de app
- ❌ Múltiples animaciones simultáneas en la misma zona visual
