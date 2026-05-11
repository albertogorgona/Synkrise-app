# Synkrise — Contexto del Proyecto

## Qué es esto
Aplicación web de Business Intelligence (BI) para PYMEs panameñas. Permite visualizar KPIs, Dashboards operacionales e indicadores sin conocimiento técnico. Incluye importación de datos desde Excel y análisis con IA en lenguaje simple.

## Stack
- **Framework**: Next.js 14 App Router + TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Gráficos**: Recharts
- **Auth + DB**: Supabase (Auth + PostgreSQL)
- **Estado global**: Zustand
- **Excel/CSV**: SheetJS (xlsx)
- **IA Insights**: Anthropic API — modelo `claude-sonnet-4-20250514`
- **Deploy**: Vercel

## Estructura del proyecto
```
synkrise-app/
├── app/
│   ├── (marketing)/          # Landing page pública
│   │   └── page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx        # Sidebar + header compartido
│   │   ├── page.tsx          # KPIs + charts principales
│   │   ├── ventas/page.tsx
│   │   ├── inventario/page.tsx
│   │   ├── clientes/page.tsx
│   │   └── financiero/page.tsx
│   └── api/
│       └── insights/route.ts # Endpoint IA → Anthropic API
├── components/
│   ├── ui/                   # shadcn/ui base
│   ├── dashboard/            # KPICard, ChartCard, Sidebar, etc.
│   └── insights/             # Panel IA flotante
├── lib/
│   ├── mockData.ts           # Datos demo estáticos
│   ├── supabase.ts           # Cliente Supabase
│   └── store.ts              # Zustand store global
├── middleware.ts             # Protección rutas /dashboard/*
└── .env.local                # Variables de entorno (nunca commitear)
```

## Sistema de diseño — Synkrise Brand
```css
--ink:     #0A1628   /* texto principal */
--surface: #F0F4FA   /* fondo general */
--white:   #FFFFFF
--accent:  #1A6FC4   /* azul principal */
--teal:    #0ABFBC   /* positivo / crecimiento */
--red:     #E05C5C   /* negativo / alerta */
--amber:   #F59E0B   /* advertencia */
--border:  #D6E4F0
--slate:   #4A6580   /* texto secundario */
--sidebar: #0F2D52   /* fondo sidebar */
```
- **Tipografía display**: Sora (headings, KPI values, logo)
- **Tipografía cuerpo**: DM Sans (todo lo demás)
- **Border radius estándar**: 14px cards, 9px nav items, 8px badges
- El logo usa el ícono SVG de la "S" geométrica de Synkrise en `#1A6FC4`

## Reglas de código
- **Todo archivo que se cree, modifique o genere en este proyecto debe estar dentro de `C:\Users\Pc\.claude\projects\synkrise-app`. Nunca crear archivos fuera de esta carpeta.**
- Siempre TypeScript estricto — sin `any`
- Imports con alias `@/` para todo lo que esté en `/app` o `/components` o `/lib`
- Componentes: PascalCase. Archivos: kebab-case
- Variables de entorno con prefijo `NEXT_PUBLIC_` solo para lo que necesita el browser
- Nunca hardcodear API keys en el código
- Usar `'use client'` solo cuando sea estrictamente necesario

## Variables de entorno requeridas
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

## Comandos clave
```bash
npm run dev       # desarrollo local → http://localhost:3000
npm run build     # verificar que compila sin errores
npm run typecheck # npx tsc --noEmit
```

## Cómo verificar cambios
Después de cada bloque de cambios importantes, correr:
1. `npm run typecheck` — sin errores de TypeScript
2. `npm run build` — sin errores de compilación
3. Revisar en `localhost:3000` visualmente

## Reglas de negocio importantes
- El Dashboard requiere autenticación — middleware protege `/dashboard/*`
- Los datos del usuario se guardan en Supabase por `user_id`
- Los insights de IA se generan en el servidor (`/api/insights`) — la API key nunca llega al browser
- La importación de Excel nunca sube archivos al servidor — todo se procesa en el browser con SheetJS
- Los mock data viven en `/lib/mockData.ts` y se reemplazan cuando el usuario importa su Excel

## Verificación de cambios con el usuario

Cada vez que se complete una actualización de un archivo, abrirlo directamente en el IDE para que el usuario pueda verificarlo visualmente. Esto aplica a cualquier archivo creado o modificado durante una tarea.

## Skills disponibles
Para animaciones → ver `.claude/skills/animations.md`
Para UI/diseño → ver `.claude/skills/design.md`
Para Excel/IA → ver `.claude/skills/data-ai.md`
## Gestión de Errores

Cada vez que encuentres un error durante el desarrollo:
1. Identifica la causa raíz antes de aplicar cualquier fix
2. Documenta el error y su solución al final de este archivo bajo la sección "## Errores Resueltos"
3. No repitas la misma solución si ya está documentada — revisa esta sección primero
4. Si un fix no funciona en el primer intento, busca una solución alternativa antes de intentar lo mismo dos veces

## Errores Resueltos

### Next.js 16 — `middleware.ts` deprecado, usar `proxy.ts`
- **Error**: `The "middleware" file convention is deprecated. Please use "proxy" instead.`
- **Causa**: Next.js 16 renombró el archivo de interceptación de requests de `middleware.ts` a `proxy.ts`, y el export `middleware` debe llamarse `proxy`.
- **Solución**: Renombrar `middleware.ts` → `proxy.ts` y cambiar `export async function middleware` → `export async function proxy`.

### React 19 — `React.FormEvent` deprecated
- **Error**: TypeScript hint `'FormEvent' is deprecated` (code 6385) en handlers `onSubmit`.
- **Causa**: En React 19 (`@types/react` v19) los tipos sintéticos de eventos como `FormEvent` fueron deprecados.
- **Solución**: Usar tipo estructural explícito: `e: { preventDefault(): void; currentTarget: HTMLFormElement }` en lugar de `React.FormEvent<HTMLFormElement>`.