-- Migration: Add scientific_name column to catches table
-- Run this in the Supabase SQL editor or via the Supabase CLI

alter table public.catches add column if not exists scientific_name text;
