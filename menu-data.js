/**
 * UMAMI Burger - Centralized Menu Data
 */
const menuData = {
    categories: [
        { id: "hamburguesas", name: "Hamburguesas" },
        { id: "perros", name: "Perros" },
        { id: "sandwiches", name: "Sándwiches" },
        { id: "salchipapas", name: "Salchipapas" },
        { id: "adiciones", name: "Adiciones" },
        { id: "bebidas", name: "Bebidas" }
    ],
    products: [
        // HAMBURGUESAS
        { category: "hamburguesas", name: "TRADII", price: 18000, description: "Pan brioche, salsa de la casa, BBQ, Vegetales frescos, Carne de res, Cebolla caramelizada, Doble queso y Tocineta.", image: "HAMBURGUESA TRADI.webp" },
        { category: "hamburguesas", name: "ALOHA", price: 20000, description: "Pan brioche, Salsa de la casa, BBQ, Vegetales frescos, Carne de res, Mermelada de Piña-Tocineta, Doble queso.", image: "HAMBURGUESA ALOHA.webp" },
        { category: "hamburguesas", name: "DOBLE", price: 22000, description: "Pan brioche, salsa de la casa, BBQ, vegetales frescos, doble carne, cebolla caramelizada, Doble queso y Tocineta." },
        { category: "hamburguesas", name: "CHEESE BLEND", price: 20000, description: "Pan brioche, Salsa de la casa, vegetales frescos, Carne de res, cebolla caramelizada, doble queso tipo cheddar, queso blanco y Tocineta.", image: "HAMBURGUESA CHEESE BLEND.webp" },
        { category: "hamburguesas", name: "GAUCHA", price: 21000, description: "Pan brioche, Salsa de la casa, Vegetales frescos, Carne de res, doble queso, chimichurri, chorizo y pimientos asados.", image: "HAMBURGUESA GAUCHA.webp" },
        { category: "hamburguesas", name: "PULLED KING", price: 26000, description: "Pan brioche, salsa BBQ de la casa, Vegetales frescos, Carne de res, pulled pork, aros de cebolla. (Basado en la imagen suelta).", image: "HAMBURGUESA PULLED KING.webp" },
        { category: "hamburguesas", name: "TRIFASICA", price: 28000, description: "Pan brioche, Salsa de la casa, Carne de res, pechuga de pollo, lomo de cerdo, vegetales frescos, queso, tocineta. (Basado en la imagen suelta).", image: "HAMBURGUESA TRIFASICA.webp" },
        
        // PERROS
        { category: "perros", name: "TRADII", price: 14000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso y tocineta." },
        { category: "perros", name: "CHICKEN", price: 20000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, pollo desmechado en salsa.", image: "PERRO CHICKEN.webp" },
        { category: "perros", name: "CRIOLLO", price: 21000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, maicitos, chorizo, ahogado y carne mechada en salsa." },
        { category: "perros", name: "CHICKEN (ALOHA O CHAMPI)", price: 21000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso, tocineta, pollo desmechado en salsa, mermelada de piña o champiñones." },
        { category: "perros", name: "ORALE", price: 21000, description: "Pan brioche, salsa de la casa, salchicha, ripio, doble queso tipo cheddar, tocineta, carne de res con jalapeños y maicitos.", image: "PERRO ORALE.webp", spicy: true },

        // SANDWICHES
        { category: "sandwiches", name: "PULLED PORK", price: 20000, description: "Pan brioche, doble jamón, coleslaw, pulled pork en salsa de la casa, doble queso y cebollitas encurtidas.", image: "SANDWICH - PULLED PORK.webp" },
        { category: "sandwiches", name: "CHICKEN", price: 20000, description: "Pan brioche, doble jamón, doble queso, pollo desmechado en salsa, vegetales frescos y chimichurri." },
        { category: "sandwiches", name: "CRIOLLO", price: 22000, description: "Pan brioche, doble jamón, doble queso, vegetales frescos, carne mechada, chorizo, maicitos y ahogado." },
        { category: "sandwiches", name: "CHAMPI ( ALOHA O CHICKEN )", price: 21000, description: "Pan brioche, pollo en salsa bechamel con champiñones o mermelada de piña, doble jamón, doble queso y vegetales frescos." },

        // SALCHIPAPAS
        { category: "salchipapas", name: "TRADII CON POLLO", price: 20000, description: "Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar y Tocineta, Pollo en salsa." },
        { category: "salchipapas", name: "LA MONTAÑERA", price: 25000, description: "Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Tocineta, Res en salsas, Maicitos, Chorizo y huevo frito." },
        { category: "salchipapas", name: "PORKY", price: 24000, description: "Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso cheddar y Tocineta, Cerdo en salsas, cebollitas encurtidas." },
        { category: "salchipapas", name: "MIXTA", price: 26000, description: "Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar, Tocineta, maicitos con pollo y carne con chorizo en salsas." },
        { category: "salchipapas", name: "TEX-MEX", price: 25000, description: "Papas, salchicha, salsa BBQ, Salsa de queso cheddar, Queso blanco, Queso cheddar, Tocineta, Carne de burger con jalapeños maicitos y salsas.", spicy: true },

        // ADICIONES
        { category: "adiciones", name: "QUESO BLANCO", price: 2000, image: "QUESO_BLANCO_USER.webp" },
        { category: "adiciones", name: "QUESO TIPO CHEDDAR", price: 3000, image: "QUESO_CHEDDAR_USER.webp" },
        { category: "adiciones", name: "PORCIÓN DE PAPAS", price: 5000, image: "ADICION_PORCION_PAPAS.webp" },
        { category: "adiciones", name: "TOCINETA", price: 3000, image: "TOCINETA.webp" },
        { category: "adiciones", name: "CEBOLLA CARAMELIZADA", price: 1000, image: "CEBOLLA_CARAMELIZADA.webp" },
        { category: "adiciones", name: "MERMELADA DE PIÑA", price: 3000, image: "MERMELADA_PIÑA.webp" },
        { category: "adiciones", name: "HUEVO FRITO", price: 2000, image: "HUEVO_FRITO.webp" },
        { category: "adiciones", name: "CHORIZO", price: 3000, image: "CHORIZO.webp" },
        { category: "adiciones", name: "ADICIÓN DE PROTEÍNA (RES, POLLO O CERDO)", price: 6000 },
        { category: "adiciones", name: "CHAMPIÑONES", price: 3000, image: "CHAMPIÑONES.webp" },
        { category: "adiciones", name: "AROS DE CEBOLLA", price: 4000, image: "AROS_DE_CEBOLLA.webp" },

        // BEBIDAS
        { category: "bebidas", name: "COCA-COLA", price: 4000, image: "COCA_COLA.webp" },
        { category: "bebidas", name: "CUATRO", price: 4000, image: "QUATRO.webp" },
        { category: "bebidas", name: "HIT LITRO", price: 8000, image: "HIT.webp" },
        { category: "bebidas", name: "CERVEZA POKER", price: 4000, image: "POKER.webp" },
        { category: "bebidas", name: "CERVEZA CLUB DORADA", price: 5000, image: "CLUB_COLOMBIA.webp" },
        { category: "bebidas", name: "AGUA", price: 3000, image: "AGUA.webp" }
    ]
};
