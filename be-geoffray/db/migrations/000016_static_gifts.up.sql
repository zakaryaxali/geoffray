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
-- Using simple IDs that match frontend: adventurer, gourmet, geek, parent, artist, trendy
-- Occasions: birthday, retirement, barbecue, christmas, wedding, justForFun

INSERT INTO static_gifts (persona_key, occasion_key, name_fr, name_en, category, amazon_affiliate_url) VALUES
-- Adventurer gifts
('adventurer', 'birthday', 'Paille filtrante LifeStraw', 'LifeStraw Personal Water Filter', 'Outdoor', 'https://amzn.to/45ZByXe'),
('adventurer', 'retirement', 'Jumelles de randonnee compactes', 'Compact Hiking Binoculars', 'Outdoor', 'https://amzn.to/4pQvyr0'),
('adventurer', 'barbecue', 'Pierre a feu de survie', 'Survival Fire Starter', 'Outdoor', 'https://amzn.to/4pQvyr0'),
('adventurer', 'christmas', 'Lampe frontale LED rechargeable', 'Rechargeable LED Headlamp', 'Outdoor', 'https://amzn.to/3NuTWRw'),
('adventurer', 'wedding', 'Hamac double ultra-leger', 'Ultra-light Double Hammock', 'Outdoor', 'https://amzn.to/4b7fv4z'),
('adventurer', 'justForFun', 'Couteau suisse Victorinox', 'Victorinox Swiss Army Knife', 'Outdoor', 'https://amzn.to/3NlG1gN'),

-- Gourmet gifts
('gourmet', 'birthday', 'Pierres a Whisky en granit', 'Granite Whisky Stones', 'Kitchen', 'https://amzn.to/4pJ4fPd'),
('gourmet', 'retirement', 'Kit fabrication fromage maison', 'Home Cheese Making Kit', 'Kitchen', 'https://amzn.to/3LTSlUU'),
('gourmet', 'barbecue', 'Presse a burger en fonte', 'Cast Iron Burger Press', 'Kitchen', 'https://amzn.to/4jQQyfR'),
('gourmet', 'christmas', 'Coffret huiles d''olive', 'Olive Oil Gift Set', 'Kitchen', 'https://amzn.to/3Lr7CMV'),
('gourmet', 'wedding', 'Plateau a fromages en bambou', 'Bamboo Cheese Board', 'Kitchen', 'https://amzn.to/4quqFF5'),
('gourmet', 'justForFun', 'Coffret de thes bio', 'Organic Tea Gift Set', 'Kitchen', 'https://amzn.to/3LCFtm8'),

-- Geek gifts
('geek', 'birthday', 'Lampe d''ambiance Pac-Man', 'Pac-Man Ambient Lamp', 'Electronics', 'https://amzn.to/49wufJ3'),
('geek', 'retirement', 'Console retro-gaming portable', 'Portable Retro Gaming Console', 'Electronics', 'https://amzn.to/4pLiZxa'),
('geek', 'barbecue', 'Tablier de cuisine Star Wars', 'Star Wars Cooking Apron', 'Home', 'https://amzn.to/45PE964'),
('geek', 'christmas', 'Clavier mecanique RGB', 'RGB Mechanical Keyboard', 'Electronics', 'https://amzn.to/3NArihS'),
('geek', 'wedding', 'Mugs Player 1 & 2', 'Player 1 & 2 Mugs Set', 'Home', 'https://amzn.to/4r6ZJeO'),
('geek', 'justForFun', 'Figurine Funko Pop', 'Funko Pop Figure', 'Collectibles', 'https://amzn.to/4qEM1Qj'),

-- Parent gifts
('parent', 'birthday', 'Album photo a remplir', 'Photo Album to Fill', 'Home', 'https://amzn.to/4qvarMd'),
('parent', 'retirement', 'Masseur cervical chauffant', 'Heated Neck Massager', 'Wellness', 'https://amzn.to/4a1Izt0'),
('parent', 'barbecue', 'Kit outils jardinage', 'Gardening Tools Kit', 'Outdoor', 'https://amzn.to/49P5Ddv'),
('parent', 'christmas', 'Cadre photo numerique Wi-Fi', 'Wi-Fi Digital Photo Frame', 'Electronics', 'https://amzn.to/4bImvVz'),
('parent', 'wedding', 'Coffret bougies parfumees', 'Scented Candles Gift Set', 'Home', 'https://amzn.to/4sPnDgl'),
('parent', 'justForFun', 'Plaid a manches', 'Wearable Blanket with Sleeves', 'Home', 'https://amzn.to/4r3IM4N'),

-- Artist gifts
('artist', 'birthday', 'Set dessin professionnel', 'Professional Drawing Set', 'Art', 'https://amzn.to/4r5olEH'),
('artist', 'retirement', 'Kit peinture avec chevalet', 'Paint Kit with Easel', 'Art', 'https://amzn.to/3LSbUgo'),
('artist', 'barbecue', 'Carnet de croquis Moleskine', 'Moleskine Sketchbook', 'Art', 'https://amzn.to/4pLk2x6'),
('artist', 'christmas', 'Tablette graphique', 'Graphics Tablet', 'Electronics', 'https://amzn.to/4sIHy0l'),
('artist', 'wedding', 'Appareil Instax Mini', 'Instax Mini Camera', 'Electronics', 'https://amzn.to/4sP5xeq'),
('artist', 'justForFun', 'Kit de calligraphie', 'Calligraphy Kit', 'Art', 'https://amzn.to/4sPogqd'),

-- Trendy/Frenchy gifts
('trendy', 'birthday', 'Boules de petanque Obut', 'Obut Petanque Balls', 'Sports', 'https://amzn.to/45NoFQ4'),
('trendy', 'retirement', 'Guide Hachette des vins', 'Hachette Wine Guide', 'Books', 'https://amzn.to/4bInghn'),
('trendy', 'barbecue', 'Coffret Opinel n8', 'Opinel N8 Gift Set', 'Kitchen', 'https://amzn.to/45PFhXm'),
('trendy', 'christmas', 'Chaussettes style tricolore', 'Tricolor Style Socks', 'Fashion', 'https://amzn.to/4sPFJyS'),
('trendy', 'wedding', 'Carafe a decanter le vin', 'Wine Decanter Carafe', 'Kitchen', 'https://amzn.to/49ZcGRX'),
('trendy', 'justForFun', 'Livre Cuisine de Reference', 'French Cuisine Reference Book', 'Books', 'https://amzn.to/4bHLusb')
ON CONFLICT (persona_key, occasion_key) DO UPDATE SET
    name_fr = EXCLUDED.name_fr,
    name_en = EXCLUDED.name_en,
    category = EXCLUDED.category,
    amazon_affiliate_url = EXCLUDED.amazon_affiliate_url;
