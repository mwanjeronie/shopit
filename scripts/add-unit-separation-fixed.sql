-- Check if columns already exist before adding them
DO $$ 
BEGIN
    -- Add pending_units column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_items' AND column_name = 'pending_units') THEN
        ALTER TABLE shopping_items ADD COLUMN pending_units INTEGER DEFAULT 0;
    END IF;
    
    -- Add done_units column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_items' AND column_name = 'done_units') THEN
        ALTER TABLE shopping_items ADD COLUMN done_units INTEGER DEFAULT 0;
    END IF;
    
    -- Add shipped_units column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_items' AND column_name = 'shipped_units') THEN
        ALTER TABLE shopping_items ADD COLUMN shipped_units INTEGER DEFAULT 0;
    END IF;
    
    -- Add success_units column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_items' AND column_name = 'success_units') THEN
        ALTER TABLE shopping_items ADD COLUMN success_units INTEGER DEFAULT 0;
    END IF;
    
    -- Add failed_units column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'failed_units' AND column_name = 'failed_units') THEN
        ALTER TABLE shopping_items ADD COLUMN failed_units INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing items to have all units in their current status
UPDATE shopping_items 
SET 
  pending_units = CASE 
    WHEN status = 'pending' OR status IS NULL OR (status != 'done' AND status != 'shipped' AND status != 'success' AND status != 'failed') 
    THEN quantity 
    ELSE 0 
  END,
  done_units = CASE WHEN status = 'done' THEN quantity ELSE 0 END,
  shipped_units = CASE WHEN status = 'shipped' THEN quantity ELSE 0 END,
  success_units = CASE WHEN status = 'success' THEN quantity ELSE 0 END,
  failed_units = CASE WHEN status = 'failed' THEN quantity ELSE 0 END
WHERE 
  COALESCE(pending_units, 0) = 0 
  AND COALESCE(done_units, 0) = 0 
  AND COALESCE(shipped_units, 0) = 0 
  AND COALESCE(success_units, 0) = 0 
  AND COALESCE(failed_units, 0) = 0;

-- Add constraint to ensure unit counts match total quantity (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_unit_totals') THEN
        ALTER TABLE shopping_items ADD CONSTRAINT check_unit_totals 
        CHECK (COALESCE(pending_units, 0) + COALESCE(done_units, 0) + COALESCE(shipped_units, 0) + COALESCE(success_units, 0) + COALESCE(failed_units, 0) = quantity);
    END IF;
END $$;

-- Add indexes for better performance (only if not exists)
CREATE INDEX IF NOT EXISTS idx_shopping_items_units ON shopping_items(list_id, pending_units, done_units, shipped_units, success_units, failed_units);
