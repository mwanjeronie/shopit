-- Add unit tracking columns to shopping_items table
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS pending_units INTEGER DEFAULT 0;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS done_units INTEGER DEFAULT 0;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS shipped_units INTEGER DEFAULT 0;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS success_units INTEGER DEFAULT 0;
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS failed_units INTEGER DEFAULT 0;

-- Update existing items to have all units in their current status
UPDATE shopping_items 
SET 
  pending_units = CASE WHEN status = 'pending' OR status IS NULL THEN quantity ELSE 0 END,
  done_units = CASE WHEN status = 'done' THEN quantity ELSE 0 END,
  shipped_units = CASE WHEN status = 'shipped' THEN quantity ELSE 0 END,
  success_units = CASE WHEN status = 'success' THEN quantity ELSE 0 END,
  failed_units = CASE WHEN status = 'failed' THEN quantity ELSE 0 END
WHERE pending_units = 0 AND done_units = 0 AND shipped_units = 0 AND success_units = 0 AND failed_units = 0;

-- Add constraint to ensure unit counts match total quantity
ALTER TABLE shopping_items ADD CONSTRAINT IF NOT EXISTS check_unit_totals 
CHECK (pending_units + done_units + shipped_units + success_units + failed_units = quantity);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_items_units ON shopping_items(list_id, pending_units, done_units, shipped_units, success_units, failed_units);
