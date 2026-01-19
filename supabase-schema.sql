-- FitFork Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)
-- This creates all tables needed for cloud sync

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DIARY ENTRIES TABLE (food diary)
-- ============================================
CREATE TABLE IF NOT EXISTS diary_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  fiber NUMERIC DEFAULT 0,
  sugar NUMERIC DEFAULT 0,
  serving_size TEXT,
  image_data TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECIPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  servings INTEGER DEFAULT 1,
  ingredients JSONB DEFAULT '[]',
  instructions TEXT,
  image_url TEXT,
  source TEXT DEFAULT 'imported',
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEIGHT ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS weight_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- PROFILES TABLE (user settings & goals)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goals JSONB DEFAULT '{"calories": 2000, "protein": 50, "carbs": 250, "fat": 65, "fiber": 25, "sugar": 50}',
  user_stats JSONB DEFAULT '{"age": 30, "height": 170, "currentWeight": 70, "targetWeight": 70, "activityLevel": "moderate", "gender": "male", "weightGoal": "maintain"}',
  dietary_preferences JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  health_goals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WATER ENTRIES TABLE (hydration tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS water_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount_ml INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXERCISE ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise_type TEXT NOT NULL,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEAL PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meals JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FITNESS CONNECTIONS TABLE (Strava, Google Fit, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS fitness_connections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  athlete_id TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- ============================================
-- INDEXES for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date ON diary_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user ON weight_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_water_entries_user_date ON water_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_exercise_entries_user_date ON exercise_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date);
CREATE INDEX IF NOT EXISTS idx_fitness_connections_user ON fitness_connections(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Users can only access their own data
-- ============================================
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_connections ENABLE ROW LEVEL SECURITY;

-- Diary Entries Policies
CREATE POLICY "Users can view own diary entries" ON diary_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diary entries" ON diary_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diary entries" ON diary_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diary entries" ON diary_entries FOR DELETE USING (auth.uid() = user_id);

-- Recipes Policies
CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (auth.uid() = user_id);

-- Weight Entries Policies
CREATE POLICY "Users can view own weight entries" ON weight_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight entries" ON weight_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weight entries" ON weight_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight entries" ON weight_entries FOR DELETE USING (auth.uid() = user_id);

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Water Entries Policies
CREATE POLICY "Users can view own water entries" ON water_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own water entries" ON water_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own water entries" ON water_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own water entries" ON water_entries FOR DELETE USING (auth.uid() = user_id);

-- Exercise Entries Policies
CREATE POLICY "Users can view own exercise entries" ON exercise_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercise entries" ON exercise_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise entries" ON exercise_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercise entries" ON exercise_entries FOR DELETE USING (auth.uid() = user_id);

-- Meal Plans Policies
CREATE POLICY "Users can view own meal plans" ON meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plans" ON meal_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plans" ON meal_plans FOR DELETE USING (auth.uid() = user_id);

-- Fitness Connections Policies
CREATE POLICY "Users can view own fitness connections" ON fitness_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fitness connections" ON fitness_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fitness connections" ON fitness_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fitness connections" ON fitness_connections FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'FitFork database schema created successfully!' AS status;
