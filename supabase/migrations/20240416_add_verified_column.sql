-- Add verified column to profiles table
ALTER TABLE profiles
ADD COLUMN verified BOOLEAN DEFAULT FALSE; 