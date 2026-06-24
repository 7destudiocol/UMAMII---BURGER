-- categories_migration.sql
-- Ejecuta este script en el editor SQL de tu panel de Supabase para habilitar las categorías dinámicas.

-- 1. Crear la tabla de categorías
CREATE TABLE IF NOT EXISTS public.umamii_categories (
    id text PRIMARY KEY,
    name text NOT NULL,
    is_hidden boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Habilitar políticas de seguridad para permitir lectura pública (para el menú web)
ALTER TABLE public.umamii_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'umamii_categories' 
        AND policyname = 'Allow public read access to categories'
    ) THEN
        CREATE POLICY "Allow public read access to categories" 
        ON public.umamii_categories 
        FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'umamii_categories' 
        AND policyname = 'Allow anon to modify categories'
    ) THEN
        CREATE POLICY "Allow anon to modify categories" 
        ON public.umamii_categories 
        FOR ALL USING (true);
    END IF;
END
$$;

-- 3. Insertar las categorías predeterminadas
INSERT INTO public.umamii_categories (id, name, sort_order)
VALUES 
    ('hamburguesas', 'Hamburguesas', 1),
    ('perros', 'Perros', 2),
    ('sandwiches', 'Sándwiches', 3),
    ('salchipapas', 'Salchipapas', 4),
    ('adiciones', 'Adiciones', 5),
    ('bebidas', 'Bebidas', 6)
ON CONFLICT (id) DO NOTHING;
