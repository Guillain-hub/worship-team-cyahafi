-- Gallery items table
CREATE TABLE IF NOT EXISTS gallery_items (
  id BIGINT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  caption TEXT,
  storage_path TEXT,
  duration TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- About images table
CREATE TABLE IF NOT EXISTS about_images (
  id BIGINT PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  storage_path TEXT,
  "order" INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON gallery_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_about_images_order ON about_images("order" ASC);

-- Enable RLS (Row Level Security) if needed
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_images ENABLE ROW LEVEL SECURITY;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('gallery', 'gallery', true),
  ('about-images', 'about-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set storage bucket policies
CREATE POLICY "Allow public read on gallery" ON storage.objects
FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Allow authenticated upload gallery" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Allow authenticated delete gallery" ON storage.objects
FOR DELETE USING (bucket_id = 'gallery');

CREATE POLICY "Allow public read on about-images" ON storage.objects
FOR SELECT USING (bucket_id = 'about-images');

CREATE POLICY "Allow authenticated upload about-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'about-images');

CREATE POLICY "Allow authenticated delete about-images" ON storage.objects
FOR DELETE USING (bucket_id = 'about-images');
