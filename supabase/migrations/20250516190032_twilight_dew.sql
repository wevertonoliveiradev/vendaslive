/*
  # Initial Database Schema Setup

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `name` (text, required)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `user_id` (uuid, references auth.users)
    
    - `sales`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `sale_date` (date, required)
      - `client_id` (uuid, references clients)
      - `instagram` (text, optional)
      - `notes` (text, optional)
      - `is_completed` (boolean, default false)
      - `user_id` (uuid, references auth.users)
    
    - `sale_photos`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `sale_id` (uuid, references sales)
      - `storage_path` (text, required)
      - `user_id` (uuid, references auth.users)
  
  2. Security
    - Enable RLS on all tables
    - Add policies to allow users to only access their own data
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  sale_date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  instagram TEXT,
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create sale_photos table
CREATE TABLE IF NOT EXISTS sale_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Users can view their own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for sales table
CREATE POLICY "Users can view their own sales"
  ON sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
  ON sales FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
  ON sales FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for sale_photos table
CREATE POLICY "Users can view their own sale photos"
  ON sale_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sale photos"
  ON sale_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sale photos"
  ON sale_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sale photos"
  ON sale_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for sale photos
INSERT INTO storage.buckets (id, name, public) VALUES ('sale_photos', 'sale_photos', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Users can view their own sale photos storage"
  ON storage.objects FOR SELECT
  USING (auth.uid() = owner);

CREATE POLICY "Users can insert their own sale photos storage"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.uid() = owner AND bucket_id = 'sale_photos');

CREATE POLICY "Users can update their own sale photos storage"
  ON storage.objects FOR UPDATE
  USING (auth.uid() = owner AND bucket_id = 'sale_photos');

CREATE POLICY "Users can delete their own sale photos storage"
  ON storage.objects FOR DELETE
  USING (auth.uid() = owner AND bucket_id = 'sale_photos');