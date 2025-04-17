-- Create professions table
CREATE TABLE IF NOT EXISTS professions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert predefined professions
INSERT INTO professions (name) VALUES
    ('Expert-comptable'),
    ('Avocat'),
    ('Notaire'),
    ('Autre')
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_professions_updated_at
    BEFORE UPDATE ON professions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE professions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read professions
CREATE POLICY "Professions are viewable by everyone"
    ON professions FOR SELECT
    USING (true);

-- Only allow authenticated users to insert/update/delete
CREATE POLICY "Professions are editable by authenticated users"
    ON professions FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated'); 