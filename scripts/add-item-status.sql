-- Add status column to shopping_items table
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Update existing items to have proper status based on completed field
UPDATE shopping_items 
SET status = CASE 
    WHEN completed = true THEN 'done'
    ELSE 'pending'
END
WHERE status = 'pending';

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_shopping_items_status ON shopping_items(list_id, status);
