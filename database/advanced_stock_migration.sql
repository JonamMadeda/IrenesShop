-- Advanced Stock Management Migration
-- This script creates the suppliers table and adds professional tracking columns to the items table.

-- 1. Create Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on Suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Suppliers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own suppliers' AND tablename = 'suppliers') THEN
        CREATE POLICY "Users can manage their own suppliers" ON public.suppliers
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Update Items Table with Advanced Metadata
-- We use a DO block to safely add columns if they don't exist
DO $$ 
BEGIN
    -- Add SKU column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='sku') THEN
        ALTER TABLE public.items ADD COLUMN sku TEXT;
    END IF;

    -- Add Barcode column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='barcode') THEN
        ALTER TABLE public.items ADD COLUMN barcode TEXT;
    END IF;

    -- Add Reorder Level column (defaulting to 50 for small shop standard)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='reorder_level') THEN
        ALTER TABLE public.items ADD COLUMN reorder_level INTEGER DEFAULT 50;
    END IF;

    -- Add Supplier ID column (foreign key)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='supplier_id') THEN
        ALTER TABLE public.items ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;
    END IF;

    -- Add Expiry Date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='expiry_date') THEN
        ALTER TABLE public.items ADD COLUMN expiry_date DATE;
    END IF;
END $$;

-- 5. Grant Permissions (Optional/Supabase standard)
GRANT ALL ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
