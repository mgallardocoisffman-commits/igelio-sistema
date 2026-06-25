-- Actualizar passwords de usuarios con hashes reales
-- Ejecutar en Supabase SQL Editor

UPDATE usuarios SET password_hash = '$2b$10$YXS1Rs/lyQ8tdMMzim4hf.qbMenyVxWIxTsFmvZNzSexj3Id3X1om' WHERE email = 'jaimearrilucea@igilio.com';
UPDATE usuarios SET password_hash = '$2b$10$4zUHUKAaYYqddL/7epqMHeueLFFl696cBAHUD.zfqsmdKpiCHuICi' WHERE email = 'bianca@igilio.com';
UPDATE usuarios SET password_hash = '$2b$10$1t/UNjxyWPoFn4vlV2vDKehyAL2dLkkyoahRW0e.UoJiFb0SawiI2' WHERE email = 'mateogallardo@igilio.com';
UPDATE usuarios SET password_hash = '$2b$10$pO5pj9JbWfvejpEOn/Ybt.RRNIPtDC.uGFnUelOCKvLGaJxkiA0CK' WHERE email = 'carlos@igilio.com';
UPDATE usuarios SET password_hash = '$2b$10$5a/SEVMXOnlTVhwP0fDGqezsstpmfV7ZBeDugHBWLW39VmeDfpzgy' WHERE email = 'roxana@igilio.com';
