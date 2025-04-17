-- Add postal_code column to profiles table
ALTER TABLE profiles
ADD COLUMN postal_code TEXT;

-- Update existing profiles with postal code if location is Éguilles
UPDATE profiles
SET postal_code = '13510'
WHERE location = 'Éguilles'; 