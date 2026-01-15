-- NutriScan Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Food History Table
CREATE TABLE IF NOT EXISTS food_history (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_data TEXT,
  food_name TEXT NOT NULL,
  category TEXT,
  health_score INTEGER,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  fiber NUMERIC DEFAULT 0,
  sugar NUMERIC DEFAULT 0,
  sodium NUMERIC DEFAULT 0,
  verdict TEXT CHECK (verdict IN ('healthy', 'moderate', 'unhealthy')),
  description TEXT,
  alternatives JSONB DEFAULT '[]',
  serving_size TEXT,
  barcode TEXT,
  brand_name TEXT,
  nutri_score TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals Table (Daily Food Diary)
CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  fiber NUMERIC DEFAULT 0,
  sugar NUMERIC DEFAULT 0,
  serving_size TEXT,
  image_data TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  source_analysis_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight History Table
CREATE TABLE IF NOT EXISTS weight_history (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  servings INTEGER DEFAULT 1,
  ingredients JSONB DEFAULT '[]',
  thumbnail TEXT,
  instructions TEXT,
  image_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goals JSONB DEFAULT '{"calories": 2000, "protein": 50, "carbs": 250, "fat": 65, "fiber": 25, "sugar": 50}',
  user_stats JSONB DEFAULT '{"age": 30, "height": 170, "currentWeight": 70, "targetWeight": 70, "activityLevel": "moderate", "gender": "male", "weightGoal": "maintain"}',
  dietary_preferences JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  health_goals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_food_history_user ON food_history(user_id);
CREATE INDEX IF NOT EXISTS idx_food_history_timestamp ON food_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_history_user ON weight_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE food_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Food History Policies
CREATE POLICY "Users can view own food history" ON food_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food history" ON food_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food history" ON food_history
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food history" ON food_history
  FOR DELETE USING (auth.uid() = user_id);

-- Meals Policies
CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON meals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON meals
  FOR DELETE USING (auth.uid() = user_id);

-- Weight History Policies
CREATE POLICY "Users can view own weight history" ON weight_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight history" ON weight_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weight history" ON weight_history
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight history" ON weight_history
  FOR DELETE USING (auth.uid() = user_id);

-- Recipes Policies
CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid() = user_id);

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
