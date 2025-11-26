-- ═══════════════════════════════════════════════════════════════════════════════
-- PROMPT ARMORY — Database Schema
-- Migration: 001_initial_schema
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROFILES (extends auth.users)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Usage limits
  generations_this_month INT DEFAULT 0,
  generations_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Preferences
  default_platform TEXT DEFAULT 'midjourney',
  default_aspect_ratio TEXT DEFAULT '16:9',
  theme TEXT DEFAULT 'dark',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FOLDERS (for organizing prompts)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#666666',
  icon TEXT DEFAULT '📁',
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROMPTS (saved prompt configurations)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Prompt State (the DNA)
  subject TEXT,
  angle TEXT,
  movement TEXT,
  lens TEXT,
  lighting TEXT,
  style TEXT,
  film_stock TEXT,
  aspect_ratio TEXT DEFAULT '16:9',
  
  -- Full generated prompts per platform (cached)
  generated_prompts JSONB DEFAULT '{}',
  
  -- Organization
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Usage tracking
  use_count INT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- GENERATIONS (history of AI generations)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  
  -- Request
  platform TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  prompt_state JSONB,
  aspect_ratio TEXT,
  
  -- Response
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  media_url TEXT,
  thumbnail_url TEXT,
  storage_path TEXT,
  
  -- Metadata from API
  api_response JSONB,
  revised_prompt TEXT,
  
  -- Cost tracking
  cost_credits DECIMAL(10,4),
  
  -- Error handling
  error_message TEXT,
  retry_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTES (attached to prompts/generations or standalone)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Linkage (optional)
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'markdown' CHECK (content_type IN ('plain', 'markdown', 'html')),
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  color TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CUSTOM CARDS (user-created arsenal options)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE custom_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Card definition
  category TEXT NOT NULL CHECK (category IN ('angle', 'movement', 'lens', 'lighting', 'style', 'filmStock')),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  
  -- Platform-specific overrides
  platform_values JSONB DEFAULT '{}',
  
  -- Organization
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- USER PRESETS (saved configurations)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE user_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Preset definition
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '◈',
  color TEXT DEFAULT '#666666',
  
  -- Configuration
  config JSONB NOT NULL,
  
  -- Organization
  category TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  
  -- Usage
  use_count INT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- USER API KEYS (bring your own keys)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  platform TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Validation
  last_validated_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, platform)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUBSCRIPTION PLANS (reference table)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  
  -- Limits (-1 = unlimited)
  generations_per_month INT,
  custom_cards_limit INT,
  presets_limit INT,
  prompts_limit INT,
  storage_gb DECIMAL(5,2),
  
  -- Features
  features JSONB,
  
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, description, generations_per_month, custom_cards_limit, presets_limit, prompts_limit, storage_gb, price_monthly, features) VALUES
  ('free', 'Free', 'Get started with basic features', 20, 10, 5, 50, 0.5, 0, '{"api_access": false, "priority_queue": false, "byok": false, "team_sharing": false}'),
  ('pro', 'Pro', 'For serious creators', 500, 100, 50, 1000, 10, 19.99, '{"api_access": true, "priority_queue": true, "byok": true, "team_sharing": false}'),
  ('team', 'Team', 'For teams and agencies', 2000, -1, -1, -1, 100, 49.99, '{"api_access": true, "priority_queue": true, "byok": true, "team_sharing": true}'),
  ('enterprise', 'Enterprise', 'Custom solutions', -1, -1, -1, -1, -1, NULL, '{"api_access": true, "priority_queue": true, "byok": true, "team_sharing": true, "sso": true, "custom_integrations": true}');

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_folder_id ON prompts(folder_id);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX idx_prompts_is_favorite ON prompts(user_id, is_favorite) WHERE is_favorite = TRUE;

CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_prompt_id ON generations(prompt_id);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_platform ON generations(platform);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_prompt_id ON notes(prompt_id);
CREATE INDEX idx_notes_generation_id ON notes(generation_id);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);

CREATE INDEX idx_custom_cards_user_category ON custom_cards(user_id, category);
CREATE INDEX idx_custom_cards_active ON custom_cards(user_id, is_active) WHERE is_active = TRUE;

CREATE INDEX idx_user_presets_user_id ON user_presets(user_id);
CREATE INDEX idx_user_presets_category ON user_presets(user_id, category);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Folders policies
CREATE POLICY "Users can view own folders" ON folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own folders" ON folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON folders FOR DELETE USING (auth.uid() = user_id);

-- Prompts policies
CREATE POLICY "Users can view own prompts" ON prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own prompts" ON prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prompts" ON prompts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prompts" ON prompts FOR DELETE USING (auth.uid() = user_id);

-- Generations policies
CREATE POLICY "Users can view own generations" ON generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own generations" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generations" ON generations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own generations" ON generations FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- Custom cards policies
CREATE POLICY "Users can view own custom_cards" ON custom_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own custom_cards" ON custom_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom_cards" ON custom_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom_cards" ON custom_cards FOR DELETE USING (auth.uid() = user_id);

-- User presets policies
CREATE POLICY "Users can view own presets" ON user_presets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own presets" ON user_presets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own presets" ON user_presets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own presets" ON user_presets FOR DELETE USING (auth.uid() = user_id);

-- User API keys policies
CREATE POLICY "Users can view own api_keys" ON user_api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own api_keys" ON user_api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own api_keys" ON user_api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own api_keys" ON user_api_keys FOR DELETE USING (auth.uid() = user_id);

-- Subscription plans are public read
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT TO PUBLIC USING (is_active = TRUE);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_prompts_updated_at 
  BEFORE UPDATE ON prompts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notes_updated_at 
  BEFORE UPDATE ON notes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_custom_cards_updated_at 
  BEFORE UPDATE ON custom_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_presets_updated_at 
  BEFORE UPDATE ON user_presets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_api_keys_updated_at 
  BEFORE UPDATE ON user_api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment generation count
CREATE OR REPLACE FUNCTION increment_generation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET generations_this_month = generations_this_month + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_generation_created
  AFTER INSERT ON generations
  FOR EACH ROW EXECUTE FUNCTION increment_generation_count();

-- Reset monthly generations (call this via cron job)
CREATE OR REPLACE FUNCTION reset_monthly_generations()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET generations_this_month = 0,
      generations_reset_at = NOW()
  WHERE generations_reset_at < NOW() - INTERVAL '1 month'
     OR generations_reset_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create bucket for generated media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generations',
  'generations',
  true,
  52428800, -- 50MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view generation files" ON storage.objects
  FOR SELECT USING (bucket_id = 'generations');

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generations' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
