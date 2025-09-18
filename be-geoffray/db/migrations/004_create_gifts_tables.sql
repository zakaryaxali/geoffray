-- Create gift_categories table
CREATE TABLE IF NOT EXISTS gift_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_key VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    order_index INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create gift_suggestions table
CREATE TABLE IF NOT EXISTS gift_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES gift_categories(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_range VARCHAR(50),
    url TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create gift_selections table for tracking user selections
CREATE TABLE IF NOT EXISTS gift_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES gift_categories(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_gift_suggestions_category ON gift_suggestions(category_id);
CREATE INDEX idx_gift_suggestions_event ON gift_suggestions(event_id);
CREATE INDEX idx_gift_selections_user ON gift_selections(user_id);
CREATE INDEX idx_gift_selections_category ON gift_selections(category_id);

-- Insert default gift categories
INSERT INTO gift_categories (name_key, color, order_index) VALUES 
    ('gift.categories.gourmet', '#e88a7c', 1),
    ('gift.categories.adventurer', '#FFA726', 2),
    ('gift.categories.geek', '#e88a7c', 3),
    ('gift.categories.parent', '#888888', 4),
    ('gift.categories.artist', '#FFA726', 5),
    ('gift.categories.trendy', '#888888', 6);