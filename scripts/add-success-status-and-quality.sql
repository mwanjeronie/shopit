-- Add quality column to shopping_items table for item variations
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS quality VARCHAR(100) DEFAULT 'Standard';

-- Update status column to include 'success' status
-- No need to alter the column as it already accepts VARCHAR(20)

-- Add index for better performance on quality queries
CREATE INDEX IF NOT EXISTS idx_shopping_items_quality ON shopping_items(list_id, quality);

-- Update existing items to have proper status progression
-- This is optional - existing items will work fine as-is
