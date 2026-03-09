-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Products Table if it doesn't exist
CREATE TABLE IF NOT EXISTS "UMAMII_products" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  image TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure description column exists (in case table existed without it)
ALTER TABLE "UMAMII_products" ADD COLUMN IF NOT EXISTS description TEXT;

-- Initial Population of UMAMII_products from menu-data.js
-- We use ON CONFLICT to avoid errors if some already exist, updating the data to match menu-data.js

INSERT INTO "UMAMII_products" (name, price, category, image, description) VALUES
('TRADII', 18000, 'Hamburguesas', 'HAMBURGUESA TRADI.webp', 'Pan brioche, salsa de la casa, BBQ, Vegetales frescos, Carne de res, Cebolla caramelizada, Doble queso y Tocineta.'),
('ALOHA', 20000, 'Hamburguesas', 'HAMBURGUESA ALOHA.webp', 'Pan brioche, Salsa de la casa, BBQ, Vegetales frescos, Carne de res, Mermelada de Piña-Tocineta, Doble queso.'),
('DOBLE', 22000, 'Hamburguesas', null, 'Pan brioche, salsa de la casa, BBQ, vegetales frescos, doble carne, cebolla caramelizada, Doble queso y Tocineta.'),
('CHEESE BLEND', 20000, 'Hamburguesas', 'HAMBURGUESA CHEESE BLEND.webp', 'Pan brioche, Salsa de la casa, vegetales frescos, Carne de res, cebolla caramelizada, doble queso tipo cheddar, queso blanco y Tocineta.'),
('GAUCHA', 21000, 'Hamburguesas', 'HAMBURGUESA GAUCHA.webp', 'Pan brioche, Salsa de la casa, Vegetales frescos, Carne de res, doble queso, chimichurri, chorizo y pimientos asados.'),
('PULLED KING', 26000, 'Hamburguesas', 'HAMBURGUESA PULLED KING.webp', 'Pan brioche, salsa BBQ de la casa, Vegetales frescos, Carne de res, pulled pork, aros de cebolla. (Basado en la imagen suelta).'),
('TRIFASICA', 28000, 'Hamburguesas', 'HAMBURGUESA TRIFASICA.webp', 'Pan brioche, Salsa de la casa, Carne de res, pechuga de pollo, lomo de cerdo, vegetales frescos, queso, tocineta. (Basado en la imagen suelta).'),
('TRADII', 14000, 'Perros', null, 'Pan brioche, salsa de la casa, salchicha, ripio, doble queso y tocineta.'),
('CHICKEN', 20000, 'Perros', 'PERRO CHICKEN.webp', 'Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, pollo desmechado en salsa.'),
('CRIOLLO', 21000, 'Perros', null, 'Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, maicitos, chorizo, ahogado y carne mechada en salsa.'),
('CHICKEN (ALOHA O CHAMPI)', 21000, 'Perros', null, 'Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, pollo desmechado en salsa, mermelada de piña o champiñones.'),
('ORALE', 21000, 'Perros', 'PERRO ORALE.webp', 'Pan brioche, salsa de la casa, salchicha, ripio, doble queso tipo cheddar, tocineta, carne de res con jalapeños y maicitos.'),
('PULLED PORK', 20000, 'Sándwiches', 'SANDWICH - PULLED PORK.webp', 'Pan brioche, doble jamón, coleslaw, pulled pork en salsa de la casa, doble queso y cebollitas encurtidas.'),
('CHICKEN', 20000, 'Sándwiches', null, 'Pan brioche, doble jamón, doble queso, pollo desmechado en salsa, vegetales frescos y chimichurri.'),
('CRIOLLO', 22000, 'Sándwiches', null, 'Pan brioche, doble jamón, doble queso, vegetales frescos, carne mechada, chorizo, maicitos y ahogado.'),
('CHAMPI ( ALOHA O CHICKEN )', 21000, 'Sándwiches', null, 'Pan brioche, pollo en salsa bechamel con champiñones o mermelada de piña, doble jamón, doble queso y vegetales frescos.'),
('TRADII CON POLLO', 20000, 'Salchipapas', null, 'Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar y Tocineta, Pollo en salsa.'),
('LA MONTAÑERA', 25000, 'Salchipapas', null, 'Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Tocineta, Res en salsas, Maicitos, Chorizo y huevo frito.'),
('PORKY', 24000, 'Salchipapas', null, 'Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso cheddar y Tocineta, Cerdo en salsas, cebollitas encurtidas.'),
('MIXTA', 26000, 'Salchipapas', null, 'Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar, Tocineta, maicitos con pollo y carne con chorizo en salsas.'),
('TEX-MEX', 25000, 'Salchipapas', null, 'Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar, Tocineta, Carne de burger con jalapeños maicitos y salsas.'),
('QUESO BLANCO', 2000, 'Adiciones', 'QUESO_BLANCO_USER.webp', null),
('QUESO TIPO CHEDDAR', 3000, 'Adiciones', 'QUESO_CHEDDAR_USER.webp', null),
('PORCIÓN DE PAPAS', 5000, 'Adiciones', 'ADICION_PORCION_PAPAS.webp', null),
('TOCINETA', 3000, 'Adiciones', 'TOCINETA.webp', null),
('CEBOLLA CARAMELIZADA', 1000, 'Adiciones', 'CEBOLLA_CARAMELIZADA.webp', null),
('MERMELADA DE PIÑA', 3000, 'Adiciones', 'MERMELADA_PIÑA.webp', null),
('HUEVO FRITO', 2000, 'Adiciones', 'HUEVO_FRITO.webp', null),
('CHORIZO', 3000, 'Adiciones', 'CHORIZO.webp', null),
('ADICIÓN DE PROTEÍNA (RES, POLLO O CERDO)', 6000, 'Adiciones', null, null),
('CHAMPIÑONES', 3000, 'Adiciones', 'CHAMPIÑONES.webp', null),
('AROS DE CEBOLLA', 4000, 'Adiciones', 'AROS_DE_CEBOLLA.webp', null),
('COCA-COLA', 4000, 'Bebidas', 'COCA_COLA.webp', null),
('CUATRO', 4000, 'Bebidas', 'QUATRO.webp', null),
('HIT LITRO', 8000, 'Bebidas', 'HIT.webp', null),
('CERVEZA POKER', 4000, 'Bebidas', 'POKER.webp', null),
('CERVEZA CLUB DORADA', 5000, 'Bebidas', 'CLUB_COLOMBIA.webp', null),
('AGUA', 3000, 'Bebidas', 'AGUA.webp', null)
ON CONFLICT (name) DO UPDATE SET
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    image = EXCLUDED.image,
    description = EXCLUDED.description;
