-- Simple gallery table creation
CREATE TABLE gallery_items (
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

-- Add indexes
CREATE INDEX idx_gallery_items_user_id ON gallery_items(user_id);
CREATE INDEX idx_gallery_items_usage_count ON gallery_items(user_id, usage_count DESC);

-- Add unique constraint
ALTER TABLE gallery_items ADD CONSTRAINT unique_user_item UNIQUE (user_id, name, category);
