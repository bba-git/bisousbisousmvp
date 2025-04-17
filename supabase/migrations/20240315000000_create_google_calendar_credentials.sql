-- Create Google Calendar credentials table
CREATE TABLE IF NOT EXISTS google_calendar_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type TEXT NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE google_calendar_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage their own calendar credentials"
    ON google_calendar_credentials
    FOR ALL
    USING (auth.uid() = professional_id)
    WITH CHECK (auth.uid() = professional_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_google_calendar_credentials_updated_at
    BEFORE UPDATE ON google_calendar_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 