-- ============================================================
-- NEXUS CELL — Profile hero_style preference
--
-- Per-user choice for the hero element on the command landing.
--   'orb'       — animated energy orb with particles + ripples (default)
--   'character' — half-dome character with eyes + cursor tracking
--
-- Toggleable in /settings → Appearance.
-- Run in Supabase SQL Editor.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hero_style TEXT NOT NULL DEFAULT 'orb'
    CHECK (hero_style IN ('orb', 'character'));
