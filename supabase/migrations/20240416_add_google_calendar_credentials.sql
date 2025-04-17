-- Create a new table for Google Calendar credentials
CREATE TABLE IF NOT EXISTS google_calendar_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE google_calendar_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage their own calendar credentials"
    ON google_calendar_credentials
    FOR ALL
    USING (auth.uid() = professional_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_google_calendar_credentials_updated_at
    BEFORE UPDATE ON google_calendar_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 