-- Create gallery_items table for universal item templates
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Sata',
  priority VARCHAR(20) DEFAULT 'medium',
  image_url TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_items_user_id ON gallery_items(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_usage_count ON gallery_items(user_id, usage_count DESC);

-- Add trigger for updated_at (only if the function exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_gallery_items_updated_at ON gallery_items;
        CREATE TRIGGER update_gallery_items_updated_at 
            BEFORE UPDATE ON gallery_items 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add unique constraint to prevent duplicates
DO $$ 
BEGIN
    ALTER TABLE gallery_items ADD CONSTRAINT unique_user_item UNIQUE (user_id, name, category);
EXCEPTION
    WHEN duplicate_object THEN 
        -- Constraint already exists, do nothing
        NULL;
END $$;

-- Function to automatically add items to gallery when they're created
CREATE OR REPLACE FUNCTION add_to_gallery()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the user_id from the shopping list and insert/update gallery item
    INSERT INTO gallery_items (user_id, name, category, priority, image_url, usage_count)
    SELECT sl.user_id, NEW.name, NEW.category, NEW.priority, NEW.image_url, 1
    FROM shopping_lists sl
    WHERE sl.id = NEW.list_id
    ON CONFLICT (user_id, name, category) DO UPDATE SET
        usage_count = gallery_items.usage_count + 1,
        updated_at = NOW(),
        priority = EXCLUDED.priority,
        image_url = COALESCE(EXCLUDED.image_url, gallery_items.image_url);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS auto_add_to_gallery ON shopping_items;
CREATE TRIGGER auto_add_to_gallery
    AFTER INSERT ON shopping_items
    FOR EACH ROW
    EXECUTE FUNCTION add_to_gallery();

-- Populate gallery with existing items (run once)
INSERT INTO gallery_items (user_id, name, category, priority, image_url, usage_count)
SELECT 
    sl.user_id, 
    si.name, 
    si.category, 
    si.priority, 
    si.image_url, 
    COUNT(*) as usage_count
FROM shopping_items si
JOIN shopping_lists sl ON si.list_id = sl.id
GROUP BY sl.user_id, si.name, si.category, si.priority, si.image_url
ON CONFLICT (user_id, name, category) DO UPDATE SET
    usage_count = EXCLUDED.usage_count,
    priority = EXCLUDED.priority,
    image_url = COALESCE(EXCLUDED.image_url, gallery_items.image_url),
    updated_at = NOW();
