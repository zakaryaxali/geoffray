-- Add gift-related columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS giftee_persona VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_occasion VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS participants_count INT DEFAULT 1;

-- Create giftee_personas table (previously gift_categories)
CREATE TABLE IF NOT EXISTS giftee_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_key VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    order_index INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create occasion_types table
CREATE TABLE IF NOT EXISTS occasion_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occasion_key VARCHAR(50) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    order_index INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create gift_suggestions table for AI-generated suggestions
CREATE TABLE IF NOT EXISTS gift_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create gift_selections table for tracking user selections
CREATE TABLE IF NOT EXISTS gift_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES giftee_personas(id) ON DELETE CASCADE,
    occasion_id UUID REFERENCES occasion_types(id),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gift_suggestions_event ON gift_suggestions(event_id);
CREATE INDEX IF NOT EXISTS idx_gift_suggestions_category ON gift_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_gift_selections_user ON gift_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_selections_persona ON gift_selections(persona_id);
CREATE INDEX IF NOT EXISTS idx_gift_selections_occasion ON gift_selections(occasion_id);
CREATE INDEX IF NOT EXISTS idx_gift_selections_event ON gift_selections(event_id);
CREATE INDEX IF NOT EXISTS idx_occasion_types_key ON occasion_types(occasion_key);

-- Insert default giftee personas
INSERT INTO giftee_personas (persona_key, color, order_index) VALUES 
    ('gift.categories.gourmet', '#e88a7c', 1),
    ('gift.categories.adventurer', '#FFA726', 2),
    ('gift.categories.geek', '#e88a7c', 3),
    ('gift.categories.parent', '#888888', 4),
    ('gift.categories.artist', '#FFA726', 5),
    ('gift.categories.trendy', '#888888', 6)
ON CONFLICT DO NOTHING;

-- Insert default occasion types
INSERT INTO occasion_types (occasion_key, name_en, name_fr, color, order_index) VALUES 
    ('birthday', 'A birthday', 'Un anniversaire', '#FFA726', 1),
    ('retirement', 'A retirement departure', 'Son départ à la retraite', '#e88a7c', 2),
    ('barbecue', 'A barbecue', 'Un barbecue', '#e88a7c', 3),
    ('christmas', 'Christmas', 'Noël', '#888888', 4),
    ('wedding', 'A wedding', 'Son mariage', '#FFA726', 5),
    ('justForFun', 'Just for fun', 'Juste par plaisir', '#888888', 6)
ON CONFLICT DO NOTHING;