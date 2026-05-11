-- ============================================================
-- Synkrise — Datos de prueba (demo → Supabase real)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- DESPUÉS de ejecutar create_tables.sql
--
-- Estos datos reproducen exactamente los valores hardcoded del
-- dashboard demo: Oct 2024 – Mar 2025 con los mismos productos,
-- totales mensuales y KPIs de resumen.
-- ============================================================

DO $$
DECLARE
  uid uuid;
BEGIN
  -- Busca el usuario por email. Reemplaza si usas otro email de prueba.
  SELECT id INTO uid
  FROM   auth.users
  WHERE  email = 'aegorgona@gmail.com'
  LIMIT  1;

  IF uid IS NULL THEN
    RAISE EXCEPTION
      'Usuario no encontrado. Asegúrate de estar registrado con el email correcto.';
  END IF;

  -- ─── kpis_resumen ──────────────────────────────────────────────────────────
  -- Dos períodos para calcular deltas (variación vs mes anterior)
  INSERT INTO public.kpis_resumen
    (user_id, periodo, ventas_totales, margen_bruto_pct, costo_operativo, ticket_promedio)
  VALUES
    (uid, '2025-02', 43150.00, 29.8, 30340.00, 165.33),  -- período anterior
    (uid, '2025-03', 48320.00, 32.4, 32640.00, 170.14)   -- período actual
  ON CONFLICT (user_id, periodo) DO NOTHING;

  -- ─── ventas: Oct 2024 – Mar 2025 ──────────────────────────────────────────
  -- Totales por mes (coinciden con mockMonthlyData del dashboard demo):
  --   Oct 2024 ~38,200 | Nov 2024 ~41,500 | Dic 2024 ~52,100
  --   Ene 2025 ~39,800 | Feb 2025 ~43,150 | Mar 2025  48,320 (exacto)
  --
  -- Precios fijos: Arroz $12 | Leche $12.50 | Aceite $12.50 | Azúcar $7.50 | Jabón $5
  -- Top-5 de Mar 2025 coincide con mockTopProducts.

  -- Octubre 2024  (~38,200)
  INSERT INTO public.ventas (user_id, fecha, producto, categoria, unidades, precio_unitario, costo_unitario) VALUES
    (uid, '2024-10-01', 'Arroz Corona 5lb',   'Granos',    1016, 12.00, 9.00),
    (uid, '2024-10-01', 'Leche Dos Pinos 1L', 'Lácteos',    809, 12.50, 8.50),
    (uid, '2024-10-01', 'Aceite Mazola 1L',   'Aceites',    620, 12.50, 8.75),
    (uid, '2024-10-01', 'Azúcar Diana 2lb',   'Granos',     658,  7.50, 5.00),
    (uid, '2024-10-01', 'Jabón Dial',         'Limpieza',   642,  5.00, 3.00);

  -- Noviembre 2024  (~41,500)
  INSERT INTO public.ventas (user_id, fecha, producto, categoria, unidades, precio_unitario, costo_unitario) VALUES
    (uid, '2024-11-01', 'Arroz Corona 5lb',   'Granos',    1104, 12.00, 9.00),
    (uid, '2024-11-01', 'Leche Dos Pinos 1L', 'Lácteos',    880, 12.50, 8.50),
    (uid, '2024-11-01', 'Aceite Mazola 1L',   'Aceites',    673, 12.50, 8.75),
    (uid, '2024-11-01', 'Azúcar Diana 2lb',   'Granos',     715,  7.50, 5.00),
    (uid, '2024-11-01', 'Jabón Dial',         'Limpieza',   697,  5.00, 3.00);

  -- Diciembre 2024  (~52,100)
  INSERT INTO public.ventas (user_id, fecha, producto, categoria, unidades, precio_unitario, costo_unitario) VALUES
    (uid, '2024-12-01', 'Arroz Corona 5lb',   'Granos',    1385, 12.00, 9.00),
    (uid, '2024-12-01', 'Leche Dos Pinos 1L', 'Lácteos',   1104, 12.50, 8.50),
    (uid, '2024-12-01', 'Aceite Mazola 1L',   'Aceites',    845, 12.50, 8.75),
    (uid, '2024-12-01', 'Azúcar Diana 2lb',   'Granos',     897,  7.50, 5.00),
    (uid, '2024-12-01', 'Jabón Dial',         'Limpieza',   876,  5.00, 3.00);

  -- Enero 2025  (~39,800)
  INSERT INTO public.ventas (user_id, fecha, producto, categoria, unidades, precio_unitario, costo_unitario) VALUES
    (uid, '2025-01-01', 'Arroz Corona 5lb',   'Granos',    1058, 12.00, 9.00),
    (uid, '2025-01-01', 'Leche Dos Pinos 1L', 'Lácteos',    844, 12.50, 8.50),
    (uid, '2025-01-01', 'Aceite Mazola 1L',   'Aceites',    646, 12.50, 8.75),
    (uid, '2025-01-01', 'Azúcar Diana 2lb',   'Granos',     685,  7.50, 5.00),
    (uid, '2025-01-01', 'Jabón Dial',         'Limpieza',   669,  5.00, 3.00);

  -- Febrero 2025  (~43,150)
  INSERT INTO public.ventas (user_id, fecha, producto, categoria, unidades, precio_unitario, costo_unitario) VALUES
    (uid, '2025-02-01', 'Arroz Corona 5lb',   'Granos',    1148, 12.00, 9.00),
    (uid, '2025-02-01', 'Leche Dos Pinos 1L', 'Lácteos',    914, 12.50, 8.50),
    (uid, '2025-02-01', 'Aceite Mazola 1L',   'Aceites',    700, 12.50, 8.75),
    (uid, '2025-02-01', 'Azúcar Diana 2lb',   'Granos',     743,  7.50, 5.00),
    (uid, '2025-02-01', 'Jabón Dial',         'Limpieza',   725,  5.00, 3.00);

  -- Marzo 2025  (exacto: 48,320 — coincide con mockTopProducts)
  INSERT INTO public.ventas (user_id, fecha, producto, categoria, unidades, precio_unitario, costo_unitario) VALUES
    (uid, '2025-03-01', 'Arroz Corona 5lb',   'Granos',    1285, 12.00, 9.00),
    (uid, '2025-03-01', 'Leche Dos Pinos 1L', 'Lácteos',   1024, 12.50, 8.50),
    (uid, '2025-03-01', 'Aceite Mazola 1L',   'Aceites',    784, 12.50, 8.75),
    (uid, '2025-03-01', 'Azúcar Diana 2lb',   'Granos',     832,  7.50, 5.00),
    (uid, '2025-03-01', 'Jabón Dial',         'Limpieza',   812,  5.00, 3.00);

  RAISE NOTICE 'Datos de prueba insertados correctamente para el usuario %', uid;
END $$;
