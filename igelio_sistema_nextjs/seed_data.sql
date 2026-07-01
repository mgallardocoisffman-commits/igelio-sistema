-- =====================================================================
-- IGE — Datos iniciales (seed)
-- Ejecutar en Supabase SQL Editor DESPUES de crear las tablas
-- =====================================================================

-- CATEGORIAS
INSERT INTO categorias (nombre, unidad_venta) VALUES
  ('Vastagos', 'm'),
  ('Accesorios', 'und'),
  ('Unas', 'und'),
  ('Adaptadores', 'und'),
  ('Equipos Industriales PE', 'und')
ON CONFLICT (nombre) DO NOTHING;

-- USUARIOS (passwords hasheados con bcrypt - password = nombre+2026)
-- jaime2026, bianca2026, mateo2026, carlos2026, roxana2026
INSERT INTO usuarios (nombre, email, password_hash, rol, sede) VALUES
  ('Jaime Arrilucea', 'jaimearrilucea@igilio.com', '$2b$10$rOmHQBGpJpFqX8YzKqX8/.K8mF9YqX8YzKqX8YzKqX8YzKqX8YzKq', 'admin_global', 'Australia'),
  ('Bianca', 'bianca@igilio.com', '$2b$10$rOmHQBGpJpFqX8YzKqX8/.K8mF9YqX8YzKqX8YzKqX8YzKqX8YzKq', 'admin_global', 'Australia'),
  ('Mateo Gallardo', 'mateogallardo@igilio.com', '$2b$10$rOmHQBGpJpFqX8YzKqX8/.K8mF9YqX8YzKqX8YzKqX8YzKqX8YzKq', 'admin_global', 'Lima'),
  ('Carlos Sarvia', 'carlos@igilio.com', '$2b$10$rOmHQBGpJpFqX8YzKqX8/.K8mF9YqX8YzKqX8YzKqX8YzKqX8YzKq', 'pos_trujillo', 'Trujillo'),
  ('Roxana Cruz', 'roxana@igilio.com', '$2b$10$rOmHQBGpJpFqX8YzKqX8/.K8mF9YqX8YzKqX8YzKqX8YzKqX8YzKq', 'contador', 'Lima')
ON CONFLICT (email) DO NOTHING;

-- PRODUCTOS — Vastagos (categoria_id = 1)
INSERT INTO productos (codigo_legacy, categoria_id, descripcion, diametro_mm, stock, stock_minimo, precio_compra, precio_puesto_depo, precio_venta_usd, precio_venta_pen) VALUES
  (101, 1, 'Vastago de 38.1', 38.1, 12, 2, NULL, NULL, NULL, NULL),
  (102, 1, 'Vastago de 40', 40, 26, 5, 28.60, 57.33, 58.00, 203.00),
  (103, 1, 'Vastago de 45', 45, 9, 2, 37.30, 74.60, 75.00, 262.50),
  (104, 1, 'Vastago de 50', 50, 3, 1, 41.60, 83.50, 84.00, 291.50),
  (105, 1, 'Vastago de 50.8', 50.8, 7.5, 2, 43.00, 86.00, 86.00, 301.00),
  (106, 1, 'Vastago de 55', 55, 29.26, 6, 45.00, 90.00, 90.00, 315.00),
  (107, 1, 'Vastago de 65', 65, 12, 2, 78.40, 156.60, 157.00, 550.00),
  (108, 1, 'Vastago de 70', 70, 9, 2, 85.00, 170.00, 170.00, 595.00),
  (109, 1, 'Vastago de 80', 80, 36, 7, 94.00, 188.00, 188.00, 658.00),
  (110, 1, 'Vastago de 85', 85, 6, 1, 112.00, 224.00, 224.00, 784.00),
  (111, 1, 'Vastago de 100', 100, 27, 5, 160.00, 320.00, 320.00, 1120.00),
  (112, 1, 'Vastago de 105', 105, 2.44, 1, 177.00, 354.00, 354.00, 1239.00),
  (113, 1, 'Vastago de 110', 110, 27, 5, 194.00, 388.00, 388.00, 1358.00)
ON CONFLICT (codigo_legacy) DO NOTHING;

-- PRODUCTOS — Accesorios (categoria_id = 2)
INSERT INTO productos (codigo_legacy, categoria_id, descripcion, stock, stock_minimo) VALUES
  (200, 2, 'Cadena Oruga para Hitachi', 1, 1),
  (201, 2, 'Engrasadora Electrica', 11, 2),
  (202, 2, 'Cucharon 320 SM', 1, 1),
  (203, 2, 'Martillo para 320', 1, 1),
  (204, 2, 'Compactadora para Excavadora 320', 1, 1),
  (205, 2, 'Garra para Excavadora 320', 1, 1),
  (206, 2, 'Garra Tronquera para 966 CAT', 1, 1),
  (207, 2, 'Rastrillo', 1, 1)
ON CONFLICT (codigo_legacy) DO NOTHING;

-- PRODUCTOS — Unas (categoria_id = 3)
INSERT INTO productos (codigo_legacy, categoria_id, descripcion, stock, stock_minimo) VALUES
  (301, 3, 'Unas 1U3352', 98, 20),
  (302, 3, 'Unas 1U3452', 227, 45),
  (303, 3, 'Unas 1U3552', 96, 19),
  (304, 3, 'Unas 1U3302', 249, 50),
  (305, 3, 'Unas retro excavadora 6Y6335', 125, 25)
ON CONFLICT (codigo_legacy) DO NOTHING;

-- PRODUCTOS — Adaptadores (categoria_id = 4)
INSERT INTO productos (codigo_legacy, categoria_id, descripcion, stock, stock_minimo) VALUES
  (401, 4, 'Adapter tipo CAT M7', 198, 40),
  (402, 4, 'Adapter 1193205', 198, 40),
  (403, 4, 'Adapter 616354', 12, 3),
  (404, 4, 'Adapter 616464', 35, 7)
ON CONFLICT (codigo_legacy) DO NOTHING;

-- PRODUCTOS — Equipos Industriales PE (categoria_id = 5)
INSERT INTO productos (codigo_legacy, categoria_id, descripcion, stock, stock_minimo, precio_puesto_depo) VALUES
  (501, 5, 'Torno', 1, 1, 6500.00),
  (502, 5, 'Torno', 1, 1, 7000.00),
  (503, 5, 'Escopladora Electrica (Tupi)', 1, 1, 1200.00),
  (504, 5, 'Generador Electrico', 1, 1, 8500.00),
  (505, 5, 'Moto Soldadora', 1, 1, 13000.00),
  (506, 5, 'Mini Torno', 1, 1, 1400.00),
  (507, 5, 'Tarraja para rosca de Tubos', 1, 1, 1200.00),
  (508, 5, 'Mini Torno', 1, 1, 2000.00)
ON CONFLICT (codigo_legacy) DO NOTHING;

-- IMPORTACION — Container Australia
INSERT INTO importaciones (codigo_lote, proveedor_pais, fecha_orden, fecha_llegada_lima, estado)
VALUES ('AU-2026-06', 'Australia', '2026-06-01', '2026-06-15', 'en_aduana')
ON CONFLICT (codigo_lote) DO NOTHING;

INSERT INTO importacion_items (importacion_id, codigo_legacy, descripcion, cantidad, precio_compra_unit_usd)
SELECT i.id, items.codigo, items.descripcion, items.cantidad, items.precio
FROM importaciones i
CROSS JOIN (VALUES
  ('AU-01', 'Montacarga Mitsubishi F8-15, Serie F-25 52467, Motor 4G33 AU1363, capacidad 1.5t', 1, 3200),
  ('AU-02', 'Montacarga Nissan PF02A25U, Chasis PF02-026710, capacidad 2.2t, Japon', 1, 3800),
  ('AU-03', 'Taladro Electrico Abarboga Maskiner, Suecia, Tipo ER 1830, N 1233181.9 HP', 1, 2100),
  ('AU-04', 'Taladro Electrico Pacific FM-700, Australia 1983, segunda mano', 1, 2550),
  ('AU-05', 'Compresora de Aire Atlas Copco XAS 50DD, Serie BLA 107208, Australia', 1, 3100),
  ('AU-06', 'Compresora de Aire Sullanair DLQ 185, Serie 37217090250, China', 1, 3000),
  ('AU-07', 'Soldadora de Hierro Cigweld, Malasia, trifasicas', 3, 950),
  ('AU-08', 'Torno de Metal Pacific 450x1500, fabricado 1988, Serie 9351', 1, 3900),
  ('AU-09', 'Martillo segunda mano Milwauki Oregon USA, Serie 551117', 1, 1200),
  ('AU-10', 'Torno de Metal McMillan PC23, fabricado 1978', 1, 950),
  ('AU-11', 'Torno de Metal Tiger Ashok, India, modelo Ahmedabad-23', 1, 3050),
  ('AU-12', 'Maquina Bendadora Hidraulica SHF, China, Tipo Y100L2-4', 1, 1400),
  ('AU-13', 'Sepilladora de madera Jointer 8, segunda mano, color verde', 1, 750),
  ('AU-14', 'Braza para Andamio, color anaranjado, segunda mano', 46, 25),
  ('AU-15', 'Caballete para Andamio, color azul, segunda mano', 24, 45),
  ('AU-16', 'Braza para Andamio liviana, color plomo, segunda mano', 22, 25),
  ('AU-17', 'Cortadora de Faja Metabo D-49716 Meppen, segunda mano', 1, 350)
) AS items(codigo, descripcion, cantidad, precio)
WHERE i.codigo_lote = 'AU-2026-06';
