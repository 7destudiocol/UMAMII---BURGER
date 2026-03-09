-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table (UMAMII_ prefix used in app)
CREATE TABLE IF NOT EXISTS "UMAMII_products" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migration: Add image column to existing UMAMII_products table
ALTER TABLE "UMAMII_products" ADD COLUMN IF NOT EXISTS image TEXT;

-- Sales Table
CREATE TABLE IF NOT EXISTS "UMAMII_sales" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES "UMAMII_products"(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS "UMAMII_expenses" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT DEFAULT 'General',
  expense_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Other Income Table
CREATE TABLE IF NOT EXISTS "UMAMII_other_income" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  income_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Cash Flow View
CREATE OR REPLACE VIEW "UMAMII_monthly_cash_flow" AS
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', sale_date) as month,
        SUM(total_price) as total_income
    FROM "UMAMII_sales"
    GROUP BY 1
),
monthly_other AS (
    SELECT
        DATE_TRUNC('month', income_date) as month,
        SUM(amount) as other_income
    FROM "UMAMII_other_income"
    GROUP BY 1
),
monthly_expenses AS (
    SELECT 
        DATE_TRUNC('month', expense_date) as month,
        SUM(amount) as total_expenses
    FROM "UMAMII_expenses"
    GROUP BY 1
)
SELECT 
    COALESCE(s.month, o.month, e.month) as month,
    COALESCE(s.total_income, 0) + COALESCE(o.other_income, 0) as income,
    COALESCE(e.total_expenses, 0) as expenses,
    COALESCE(s.total_income, 0) + COALESCE(o.other_income, 0) - COALESCE(e.total_expenses, 0) as cash_flow
FROM monthly_sales s
FULL OUTER JOIN monthly_other o ON s.month = o.month
FULL OUTER JOIN monthly_expenses e ON COALESCE(s.month, o.month) = e.month
ORDER BY 1 ASC;

-- Enable Row Level Security (optional, set to public for now)
ALTER TABLE "UMAMII_products"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UMAMII_sales"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UMAMII_expenses"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UMAMII_other_income" ENABLE ROW LEVEL SECURITY;

-- Allow all for anon key (adjust for production)
CREATE POLICY IF NOT EXISTS "allow_all_products"     ON "UMAMII_products"     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all_sales"        ON "UMAMII_sales"        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all_expenses"     ON "UMAMII_expenses"     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "allow_all_other_income" ON "UMAMII_other_income" FOR ALL USING (true) WITH CHECK (true);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Expenses Table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT DEFAULT 'General',
  expense_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Basic Data Insertion (Example Products)
INSERT INTO products (name, price, category) VALUES
('Burger Clásica', 15000, 'Burgers'),
('Burger Especial', 18000, 'Burgers'),
('Papas Fritas', 5000, 'Sides'),
('Gaseosa', 3000, 'Drinks');

-- Views for Statistics
-- Sales per product summary
CREATE OR REPLACE VIEW product_sales_summary AS
SELECT 
    p.name, 
    SUM(s.quantity) as total_sold, 
    SUM(s.total_price) as total_revenue
FROM sales s
JOIN products p ON s.product_id = p.id
GROUP BY p.name
ORDER BY total_sold DESC;

-- Monthly Cash Flow
CREATE OR REPLACE VIEW monthly_cash_flow AS
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', sale_date) as month,
        SUM(total_price) as total_income
    FROM sales
    GROUP BY 1
),
monthly_expenses AS (
    SELECT 
        DATE_TRUNC('month', expense_date) as month,
        SUM(amount) as total_expenses
    FROM expenses
    GROUP BY 1
)
SELECT 
    COALESCE(s.month, e.month) as month,
    COALESCE(s.total_income, 0) as income,
    COALESCE(e.total_expenses, 0) as expenses,
    COALESCE(s.total_income, 0) - COALESCE(e.total_expenses, 0) as cash_flow
FROM monthly_sales s
FULL OUTER JOIN monthly_expenses e ON s.month = e.month;
