-- ============================================================
-- Synkrise — Tablas de datos reales
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── Tabla: ventas ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ventas (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha           date        NOT NULL,
  producto        text        NOT NULL,
  categoria       text,
  unidades        integer,
  precio_unitario numeric(10,2),
  costo_unitario  numeric(10,2),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario solo accede a sus propios registros
CREATE POLICY "ventas_owner" ON public.ventas
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índices útiles
CREATE INDEX IF NOT EXISTS ventas_user_fecha ON public.ventas (user_id, fecha);
CREATE INDEX IF NOT EXISTS ventas_user_producto ON public.ventas (user_id, producto);


-- ─── Tabla: inventario ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventario (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producto        text        NOT NULL,
  categoria       text        NOT NULL,
  stock_actual    numeric(12,2),
  stock_minimo    numeric(12,2),
  rotacion        numeric(8,2),
  costo_unitario  numeric(10,2),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventario_owner" ON public.inventario
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS inventario_user_producto ON public.inventario (user_id, producto);


-- ─── Tabla: clientes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clientes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id      text        NOT NULL,
  cliente         text        NOT NULL,
  segmento        text,
  compras         integer,
  facturacion     numeric(12,2),
  ultima_compra   date,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_owner" ON public.clientes
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS clientes_user_id ON public.clientes (user_id, cliente_id);


-- ─── Tabla: kpis_resumen ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kpis_resumen (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periodo          text        NOT NULL,    -- formato "YYYY-MM", ej. "2025-03"
  ventas_totales   numeric(12,2),
  margen_bruto_pct numeric(5,2),
  costo_operativo  numeric(12,2),
  ticket_promedio  numeric(10,2),
  created_at       timestamptz DEFAULT now(),
  UNIQUE (user_id, periodo)
);

ALTER TABLE public.kpis_resumen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpis_resumen_owner" ON public.kpis_resumen
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS kpis_user_periodo ON public.kpis_resumen (user_id, periodo DESC);
