# Skill: UI y Diseño — Synkrise Design System

## Cuándo aplicar este skill
Siempre que crees o modifiques componentes visuales: cards, tablas, gráficos, formularios, navegación, badges, o cualquier elemento de la interfaz.

---

## Principios de diseño Synkrise

1. **Datos primero** — Nada compite visualmente con los números. El diseño encuadra, no distrae.
2. **Familiaridad instantánea** — Un dueño de PYME panameña sin experiencia técnica debe entender el dashboard en 10 segundos.
3. **Jerarquía clara** — KPI values grandes, labels pequeños, deltas en color semántico.
4. **Densidad controlada** — Suficiente información por pantalla, sin sentirse abrumado.

---

## Tokens de diseño

### Colores
```css
:root {
  /* Fondo y superficie */
  --ink:     #0A1628;   /* texto principal — headings, valores */
  --surface: #F0F4FA;   /* fondo de la página */
  --white:   #FFFFFF;   /* fondo de cards */
  --border:  #D6E4F0;   /* bordes y divisores */
  --slate:   #4A6580;   /* texto secundario, labels, subtítulos */

  /* Acento — familia azul */
  --accent:       #1A6FC4;  /* azul principal — CTAs, links activos */
  --accent-light: #E6F0FB;  /* fondo de badges azules */

  /* Semánticos */
  --teal:       #0ABFBC;  /* positivo, crecimiento, ↑ */
  --teal-light: #E0F8F8;
  --red:        #E05C5C;  /* negativo, alerta, ↓ */
  --red-light:  #FEF1F1;
  --amber:      #F59E0B;  /* advertencia, neutro */

  /* Sidebar */
  --sidebar: #0F2D52;   /* fondo sidebar — gradiente de #0A2040 a #0F2D52 */
}
```

### Tipografía
```css
/* Títulos, KPI values, logo */
font-family: 'Sora', sans-serif;
/* Headings grandes */   font-size: 22px; font-weight: 700; letter-spacing: -0.03em;
/* Chart titles */       font-size: 14px; font-weight: 600; letter-spacing: -0.02em;
/* KPI values */         font-size: 28px; font-weight: 700; letter-spacing: -0.04em;

/* Cuerpo, labels, tablas */
font-family: 'DM Sans', sans-serif;
/* Labels uppercase */   font-size: 11.5px; font-weight: 500; letter-spacing: 0.05em;
/* Cuerpo tabla */       font-size: 13px;
/* Subtítulos */         font-size: 12px; color: var(--slate);
```

### Espaciado y radios
```css
--radius-card: 14px;    /* cards principales */
--radius-nav:   9px;    /* nav items del sidebar */
--radius-badge: 8px;    /* badges header */
--radius-pill: 12px;    /* pills de estado en tabla */
--gap-grid:    16px;    /* gap entre cards */
--padding-card: 20px 22px; /* padding interno de cards */
```

---

## Componentes estándar

### KPI Card
```tsx
// Estructura obligatoria de un KPI Card
<div className="kpi-card"> // border-top de color semántico
  <span className="kpi-label">VENTAS TOTALES</span>      // uppercase, slate
  <span className="kpi-value">$48,320</span>             // Sora, 28px, ink
  <span className="kpi-delta up">↑ +12.4% vs anterior</span> // teal si up, red si down
  <div className="kpi-bar">                               // progress bar 4px
    <div className="kpi-bar-fill" style={{width:'74%'}}/>
  </div>
</div>
```

**Variantes de color del borde superior**:
- Default (sin clase): `--accent` azul → ventas, revenue
- `.teal`: `--teal` → márgenes, eficiencia
- `.red`: `--red` → costos, alertas
- `.amber`: `--amber` → métricas neutras

### Chart Card
```tsx
<div className="chart-card"> // bg white, border, radius 14px, padding 22px
  <div className="chart-header"> // flex, space-between
    <div>
      <h3 className="chart-title">Evolución de Ventas</h3>
      <p className="chart-subtitle">Últimos 6 meses</p>
    </div>
    <span className="chart-badge">↑ +12.4% MoM</span>
    {/* chart-badge.neg para negativo */}
  </div>
  {/* Recharts component */}
</div>
```

### Sidebar Nav Item
```tsx
// Activo: fondo azul translúcido + border-left + texto claro
// Hover: fondo blanco 5% opacity
// El indicador activo usa motion.div con layoutId="sidebar-active"
```

### Pills de estado (tabla)
```tsx
<span className="pill high">↑ Alta</span>    // teal-light bg
<span className="pill mid">→ Estable</span>  // accent-light bg
<span className="pill low">↓ Baja</span>     // red-light bg
```

---

## Recharts — Configuración estándar

```tsx
// Paleta de colores para todos los charts
const CHART_COLORS = {
  primary: '#1A6FC4',
  teal: '#0ABFBC',
  red: '#E05C5C',
  amber: '#F59E0B',
  slate: '#4A6580',
  grid: 'rgba(26, 111, 196, 0.06)',
  // Familia azul para charts multi-serie
  blue400: '#3A8FD8',
  blue300: '#5BA4CF',
  blue200: '#A8CCE8',
  blue100: '#D6E4F0',
}

// Tick style estándar para todos los ejes
const tickStyle = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 12,
  fill: '#4A6580',
}

// Tooltip estándar
<Tooltip
  contentStyle={{
    background: '#0A1628',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontFamily: 'DM Sans',
    fontSize: '12px',
  }}
/>
```

---

## Layout del Dashboard

```
┌─────────────────────────────────────────────────────┐
│ SIDEBAR (220px fijo)  │  MAIN (flex: 1, scroll)     │
│  Logo Synkrise        │  Header (título + badges)   │
│  ─────────────        │  KPI Row (4 columnas)        │
│  Dashboard ←activo    │  Charts Row (2fr + 1fr)      │
│  Ventas               │  Charts Row 2 (1fr + 1fr)   │
│  Inventario           │  Table + Chart Row           │
│  Clientes             │                              │
│  ── Reportes ──       │                              │
│  Financiero           │                              │
│  KPIs                 │                              │
│  Configuración        │                              │
└─────────────────────────────────────────────────────┘
```

---

## Google Fonts — importación obligatoria
```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```
En Next.js usar `next/font/google`:
```tsx
import { Sora, DM_Sans } from 'next/font/google'
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
```

---

## Logo SVG — siempre usar este
```svg
<svg width="30" height="30" viewBox="0 0 36 36" fill="none">
  <rect width="36" height="36" rx="9" fill="#1A6FC4"/>
  <path d="M10 22 L16 14 L20 18 L24 12"
    stroke="white" stroke-width="2.5"
    stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="26" cy="12" r="2.5" fill="#0ABFBC"/>
  <path d="M10 26 H26"
    stroke="rgba(255,255,255,0.3)"
    stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

---

## Checklist visual antes de entregar un componente
- [ ] ¿Usa variables CSS del design system? (no colores hardcodeados)
- [ ] ¿Tipografía: Sora para titles/values, DM Sans para todo lo demás?
- [ ] ¿Deltas en color semántico: teal=positivo, red=negativo?
- [ ] ¿Cards con `border: 1px solid var(--border)` y `border-radius: 14px`?
- [ ] ¿Sidebar con fondo `#0F2D52` y texto en opacidades de blanco?
- [ ] ¿Responsive: no se rompe en 1280px?
