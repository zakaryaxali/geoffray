-- Create static_gifts table for curated gift suggestions
CREATE TABLE IF NOT EXISTS static_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_key VARCHAR(50) NOT NULL,
    occasion_key VARCHAR(50) NOT NULL,
    name_fr VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    price_range VARCHAR(50),
    category VARCHAR(100),
    amazon_affiliate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(persona_key, occasion_key)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_static_gifts_persona ON static_gifts(persona_key);
CREATE INDEX IF NOT EXISTS idx_static_gifts_occasion ON static_gifts(occasion_key);
CREATE INDEX IF NOT EXISTS idx_static_gifts_persona_occasion ON static_gifts(persona_key, occasion_key);

-- Seed the 36 curated suggestions from spreadsheet
-- Mapping: Aventurier->gift.categories.adventurer, Gourmet->gift.categories.gourmet,
-- Geek->gift.categories.geek, Parent->gift.categories.parent,
-- Artiste->gift.categories.artist, Frenchy->gift.categories.trendy
-- Mapping: Anniversaire->birthday, Retraite->retirement, Barbecue->barbecue,
-- Noel->christmas, Mariage->wedding, Plaisir->justForFun

INSERT INTO static_gifts (persona_key, occasion_key, name_fr, name_en, category, amazon_affiliate_url) VALUES
-- Adventurer gifts
('gift.categories.adventurer', 'birthday', 'Paille filtrante LifeStraw', 'LifeStraw Personal Water Filter', 'Outdoor', 'https://amzn.to/45ZByXe'),
('gift.categories.adventurer', 'retirement', 'Jumelles de randonnee compactes', 'Compact Hiking Binoculars', 'Outdoor', 'https://amzn.to/4pQvyr0'),
('gift.categories.adventurer', 'barbecue', 'Pierre a feu de survie', 'Survival Fire Starter', 'Outdoor', 'https://amzn.to/4pQvyr0'),
('gift.categories.adventurer', 'christmas', 'Lampe frontale LED rechargeable', 'Rechargeable LED Headlamp', 'Outdoor', 'https://amzn.to/3NuTWRw'),
('gift.categories.adventurer', 'wedding', 'Hamac double ultra-leger', 'Ultra-light Double Hammock', 'Outdoor', 'https://amzn.to/4b7fv4z'),
('gift.categories.adventurer', 'justForFun', 'Couteau suisse Victorinox', 'Victorinox Swiss Army Knife', 'Outdoor', 'https://amzn.to/3NlG1gN'),

-- Gourmet gifts
('gift.categories.gourmet', 'birthday', 'Pierres a Whisky en granit', 'Granite Whisky Stones', 'Kitchen', 'https://amzn.to/4pJ4fPd'),
('gift.categories.gourmet', 'retirement', 'Kit fabrication fromage maison', 'Home Cheese Making Kit', 'Kitchen', 'https://amzn.to/3LTSlUU'),
('gift.categories.gourmet', 'barbecue', 'Presse a burger en fonte', 'Cast Iron Burger Press', 'Kitchen', 'https://amzn.to/4jQQyfR'),
('gift.categories.gourmet', 'christmas', 'Coffret huiles d''olive', 'Olive Oil Gift Set', 'Kitchen', 'https://amzn.to/3Lr7CMV'),
('gift.categories.gourmet', 'wedding', 'Plateau a fromages en bambou', 'Bamboo Cheese Board', 'Kitchen', 'https://amzn.to/4quqFF5'),
('gift.categories.gourmet', 'justForFun', 'Coffret de thes bio', 'Organic Tea Gift Set', 'Kitchen', 'https://amzn.to/3LCFtm8'),

-- Geek gifts
('gift.categories.geek', 'birthday', 'Lampe d''ambiance Pac-Man', 'Pac-Man Ambient Lamp', 'Electronics', 'https://amzn.to/49wufJ3'),
('gift.categories.geek', 'retirement', 'Console retro-gaming portable', 'Portable Retro Gaming Console', 'Electronics', 'https://amzn.to/4pLiZxa'),
('gift.categories.geek', 'barbecue', 'Tablier de cuisine Star Wars', 'Star Wars Cooking Apron', 'Home', 'https://amzn.to/45PE964'),
('gift.categories.geek', 'christmas', 'Clavier mecanique RGB', 'RGB Mechanical Keyboard', 'Electronics', 'https://amzn.to/3NArihS'),
('gift.categories.geek', 'wedding', 'Mugs Player 1 & 2', 'Player 1 & 2 Mugs Set', 'Home', 'https://amzn.to/4r6ZJeO'),
('gift.categories.geek', 'justForFun', 'Figurine Funko Pop', 'Funko Pop Figure', 'Collectibles', 'https://amzn.to/4qEM1Qj'),

-- Parent gifts
('gift.categories.parent', 'birthday', 'Album photo a remplir', 'Photo Album to Fill', 'Home', 'https://amzn.to/4qvarMd'),
('gift.categories.parent', 'retirement', 'Masseur cervical chauffant', 'Heated Neck Massager', 'Wellness', 'https://amzn.to/4a1Izt0'),
('gift.categories.parent', 'barbecue', 'Kit outils jardinage', 'Gardening Tools Kit', 'Outdoor', 'https://amzn.to/49P5Ddv'),
('gift.categories.parent', 'christmas', 'Cadre photo numerique Wi-Fi', 'Wi-Fi Digital Photo Frame', 'Electronics', 'https://amzn.to/4bImvVz'),
('gift.categories.parent', 'wedding', 'Coffret bougies parfumees', 'Scented Candles Gift Set', 'Home', 'https://amzn.to/4sPnDgl'),
('gift.categories.parent', 'justForFun', 'Plaid a manches', 'Wearable Blanket with Sleeves', 'Home', 'https://amzn.to/4r3IM4N'),

-- Artist gifts
('gift.categories.artist', 'birthday', 'Set dessin professionnel', 'Professional Drawing Set', 'Art', 'https://amzn.to/4r5olEH'),
('gift.categories.artist', 'retirement', 'Kit peinture avec chevalet', 'Paint Kit with Easel', 'Art', 'https://amzn.to/3LSbUgo'),
('gift.categories.artist', 'barbecue', 'Carnet de croquis Moleskine', 'Moleskine Sketchbook', 'Art', 'https://amzn.to/4pLk2x6'),
('gift.categories.artist', 'christmas', 'Tablette graphique', 'Graphics Tablet', 'Electronics', 'https://amzn.to/4sIHy0l'),
('gift.categories.artist', 'wedding', 'Appareil Instax Mini', 'Instax Mini Camera', 'Electronics', 'https://amzn.to/4sP5xeq'),
('gift.categories.artist', 'justForFun', 'Kit de calligraphie', 'Calligraphy Kit', 'Art', 'https://amzn.to/4sPogqd'),

-- Trendy/Frenchy gifts
('gift.categories.trendy', 'birthday', 'Boules de petanque Obut', 'Obut Petanque Balls', 'Sports', 'https://amzn.to/45NoFQ4'),
('gift.categories.trendy', 'retirement', 'Guide Hachette des vins', 'Hachette Wine Guide', 'Books', 'https://amzn.to/4bInghn'),
('gift.categories.trendy', 'barbecue', 'Coffret Opinel n8', 'Opinel N8 Gift Set', 'Kitchen', 'https://amzn.to/45PFhXm'),
('gift.categories.trendy', 'christmas', 'Chaussettes style tricolore', 'Tricolor Style Socks', 'Fashion', 'https://amzn.to/4sPFJyS'),
('gift.categories.trendy', 'wedding', 'Carafe a decanter le vin', 'Wine Decanter Carafe', 'Kitchen', 'https://amzn.to/49ZcGRX'),
('gift.categories.trendy', 'justForFun', 'Livre Cuisine de Reference', 'French Cuisine Reference Book', 'Books', 'https://amzn.to/4bHLusb')
ON CONFLICT (persona_key, occasion_key) DO UPDATE SET
    name_fr = EXCLUDED.name_fr,
    name_en = EXCLUDED.name_en,
    category = EXCLUDED.category,
    amazon_affiliate_url = EXCLUDED.amazon_affiliate_url;
