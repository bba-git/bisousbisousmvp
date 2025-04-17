-- First, drop the existing constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profession_id_required_for_professionals;

-- Ensure we have an "Autre" profession
INSERT INTO professions (name)
VALUES ('Autre')
ON CONFLICT (name) DO NOTHING;

-- Get the ID of the "Autre" profession and update all professional profiles without a profession_id
DO $$
DECLARE
    autre_id UUID;
BEGIN
    -- Get the ID of the "Autre" profession
    SELECT id INTO autre_id FROM professions WHERE name = 'Autre';
    
    -- Update all professional profiles that don't have a profession_id
    UPDATE profiles p
    SET profession_id = autre_id
    WHERE p.user_type = 'professionnel' AND p.profession_id IS NULL;
END $$;

-- Add new constraint that allows null for clients
ALTER TABLE profiles
ADD CONSTRAINT profession_id_required_for_professionals
CHECK (
    (user_type = 'professionnel' AND profession_id IS NOT NULL) OR
    (user_type = 'client' AND profession_id IS NULL)
); 