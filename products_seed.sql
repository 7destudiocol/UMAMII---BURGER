-- ============================================================
-- UMAMII_products  Agregar columnas faltantes e insertar menú
-- ============================================================

-- 1. Agregar columnas faltantes
ALTER TABLE umamii_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE umamii_products ADD COLUMN IF NOT EXISTS spicy     BOOLEAN DEFAULT false;
ALTER TABLE umamii_products ADD COLUMN IF NOT EXISTS image     TEXT;

-- 2. Limpiar productos existentes para evitar duplicados
DELETE FROM umamii_products;

-- ============================================================
-- 3. Insertar todos los productos del menú
-- ============================================================

INSERT INTO umamii_products (name, price, category, description, image, spicy) VALUES

--  HAMBURGUESAS 
('TRADII',
 18000, 'hamburguesas',
 'Pan brioche, salsa de la casa, BBQ, Vegetales frescos, Carne de res, Cebolla caramelizada, Doble queso y Tocineta.',
 'HAMBURGUESA TRADI.webp', false),

('ALOHA',
 20000, 'hamburguesas',
 'Pan brioche, Salsa de la casa, BBQ, Vegetales frescos, Carne de res, Mermelada de Piña-Tocineta, Doble queso.',
 'HAMBURGUESA ALOHA.webp', false),

('DOBLE',
 22000, 'hamburguesas',
 'Pan brioche, salsa de la casa, BBQ, vegetales frescos, doble carne, cebolla caramelizada, Doble queso y Tocineta.',
 NULL, false),

('CHEESE BLEND',
 20000, 'hamburguesas',
 'Pan brioche, Salsa de la casa, vegetales frescos, Carne de res, cebolla caramelizada, doble queso tipo cheddar, queso blanco y Tocineta.',
 'HAMBURGUESA CHEESE BLEND.webp', false),

('GAUCHA',
 21000, 'hamburguesas',
 'Pan brioche, Salsa de la casa, Vegetales frescos, Carne de res, doble queso, chimichurri, chorizo y pimientos asados.',
 'HAMBURGUESA GAUCHA.webp', false),

('PULLED KING',
 26000, 'hamburguesas',
 'Pan brioche, salsa BBQ de la casa, Vegetales frescos, Carne de res, pulled pork, aros de cebolla.',
 'HAMBURGUESA PULLED KING.webp', false),

('TRIFASICA',
 28000, 'hamburguesas',
 'Pan brioche, Salsa de la casa, Carne de res, pechuga de pollo, lomo de cerdo, vegetales frescos, queso, tocineta.',
 'HAMBURGUESA TRIFASICA.webp', false),

--  PERROS 
('PERRO TRADII',
 14000, 'perros',
 'Pan brioche, salsa de la casa, salchicha, ripio, doble queso y tocineta.',
 NULL, false),

('PERRO CHICKEN',
 20000, 'perros',
 'Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, pollo desmechado en salsa.',
 'PERRO CHICKEN.webp', false),

('PERRO CRIOLLO',
 21000, 'perros',
 'Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, maicitos, chorizo, ahogado y carne mechada en salsa.',
 NULL, false),

('PERRO CHICKEN (ALOHA O CHAMPI)',
 21000, 'perros',
 'Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, pollo desmechado en salsa, mermelada de piña o champiñones.',
 NULL, false),

('PERRO ORALE',
 21000, 'perros',
 'Pan brioche, salsa de la casa, salchicha, ripio, doble queso tipo cheddar, tocineta, carne de res con jalapeños y maicitos.',
 'PERRO ORALE.webp', true),

--  SÁNDWICHES 
('SANDWICH PULLED PORK',
 20000, 'sandwiches',
 'Pan brioche, doble jamón, coleslaw, pulled pork en salsa de la casa, doble queso y cebollitas encurtidas.',
 'SANDWICH - PULLED PORK.webp', false),

('SANDWICH CHICKEN',
 20000, 'sandwiches',
 'Pan brioche, doble jamón, doble queso, pollo desmechado en salsa, vegetales frescos y chimichurri.',
 NULL, false),

('SANDWICH CRIOLLO',
 22000, 'sandwiches',
 'Pan brioche, doble jamón, doble queso, vegetales frescos, carne mechada, chorizo, maicitos y ahogado.',
 NULL, false),

('SANDWICH CHAMPI (ALOHA O CHICKEN)',
 21000, 'sandwiches',
 'Pan brioche, pollo en salsa bechamel con champiñones o mermelada de piña, doble jamón, doble queso y vegetales frescos.',
 NULL, false),

--  SALCHIPAPAS 
('SALCHIPAPA TRADII CON POLLO',
 20000, 'salchipapas',
 'Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar y Tocineta, Pollo en salsa.',
 NULL, false),

('SALCHIPAPA LA MONTANERA',
 25000, 'salchipapas',
 'Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Tocineta, Res en salsas, Maicitos, Chorizo y huevo frito.',
 NULL, false),

('SALCHIPAPA PORKY',
 24000, 'salchipapas',
 'Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso cheddar y Tocineta, Cerdo en salsas, cebollitas encurtidas.',
 NULL, false),

('SALCHIPAPA MIXTA',
 26000, 'salchipapas',
 'Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar, Tocineta, maicitos con pollo y carne con chorizo en salsas.',
 NULL, false),

('SALCHIPAPA TEX-MEX',
 25000, 'salchipapas',
 'Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar, Tocineta, Carne de burger con jalapenos, maicitos y salsas.',
 NULL, true),

--  ADICIONES 
('QUESO BLANCO',                          2000, 'adiciones', NULL, 'QUESO_BLANCO_USER.webp',     false),
('QUESO TIPO CHEDDAR',                    3000, 'adiciones', NULL, 'QUESO_CHEDDAR_USER.webp',    false),
('PORCION DE PAPAS',                      5000, 'adiciones', NULL, 'ADICION_PORCION_PAPAS.webp', false),
('TOCINETA',                              3000, 'adiciones', NULL, 'TOCINETA.webp',              false),
('CEBOLLA CARAMELIZADA',                  1000, 'adiciones', NULL, 'CEBOLLA_CARAMELIZADA.webp',  false),
('MERMELADA DE PINA',                     3000, 'adiciones', NULL, 'MERMELADA_PINA.webp',        false),
('HUEVO FRITO',                           2000, 'adiciones', NULL, 'HUEVO_FRITO.webp',           false),
('CHORIZO',                               3000, 'adiciones', NULL, 'CHORIZO.webp',               false),
('ADICION DE PROTEINA (RES, POLLO O CERDO)', 6000, 'adiciones', NULL, NULL,                      false),
('CHAMPINONES',                           3000, 'adiciones', NULL, 'CHAMPINONES.webp',           false),
('AROS DE CEBOLLA',                       4000, 'adiciones', NULL, 'AROS_DE_CEBOLLA.webp',       false),

--  BEBIDAS 
('COCA-COLA',           4000, 'bebidas', NULL, 'COCA_COLA.webp',    false),
('CUATRO',              4000, 'bebidas', NULL, 'QUATRO.webp',       false),
('HIT LITRO',           8000, 'bebidas', NULL, 'HIT.webp',          false),
('CERVEZA POKER',       4000, 'bebidas', NULL, 'POKER.webp',        false),
('CERVEZA CLUB DORADA', 5000, 'bebidas', NULL, 'CLUB_COLOMBIA.webp',false),
('AGUA',                3000, 'bebidas', NULL, 'AGUA.webp',         false);

-- ============================================================
-- 4. Verificar resultado
-- ============================================================
SELECT category, name, price, spicy,
       CASE WHEN image       IS NOT NULL THEN 'si' ELSE 'no' END AS tiene_imagen,
       CASE WHEN description IS NOT NULL THEN 'si' ELSE 'no' END AS tiene_descripcion
FROM umamii_products
ORDER BY category, name;
