-- Update events table to include gift persona and occasion
ALTER TABLE events ADD COLUMN giftee_persona VARCHAR(50);
ALTER TABLE events ADD COLUMN event_occasion VARCHAR(50);
ALTER TABLE events ADD COLUMN participants_count INT DEFAULT 1;

-- Create gift_suggestions table for storing AI-generated suggestions
CREATE TABLE IF NOT EXISTS gift_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name_en VARCHAR(255) NOT NULL,
    name_fr VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_fr TEXT,
    price_range VARCHAR(50),
    category VARCHAR(100),
    url TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for gift_suggestions
CREATE INDEX idx_gift_suggestions_event ON gift_suggestions(event_id);
CREATE INDEX idx_gift_suggestions_category ON gift_suggestions(category);

-- Rename existing gift tables to match new conventions
ALTER TABLE gift_categories RENAME TO giftee_personas;
ALTER TABLE giftee_personas RENAME COLUMN name_key TO persona_key;

-- Create occasion_types table
CREATE TABLE IF NOT EXISTS occasion_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occasion_key VARCHAR(50) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    order_index INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default occasion types matching the wireframe
INSERT INTO occasion_types (occasion_key, name_en, name_fr, color, order_index) VALUES 
    ('birthday', 'A birthday', 'Un anniversaire', '#FFA726', 1),
    ('retirement', 'A retirement departure', 'Son départ à la retraite', '#e88a7c', 2),
    ('barbecue', 'A barbecue', 'Un barbecue', '#e88a7c', 3),
    ('christmas', 'Christmas', 'Noël', '#888888', 4),
    ('wedding', 'A wedding', 'Son mariage', '#FFA726', 5),
    ('justForFun', 'Just for fun', 'Juste par plaisir', '#888888', 6);

-- Update existing gift_selections table to include occasion
ALTER TABLE gift_selections ADD COLUMN occasion_id UUID REFERENCES occasion_types(id);

-- Create indexes for occasion_types
CREATE INDEX idx_occasion_types_key ON occasion_types(occasion_key);
CREATE INDEX idx_gift_selections_occasion ON gift_selections(occasion_id);