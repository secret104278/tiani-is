-- Migration: Add qiudao card fields to User table
-- This migration adds fields for storing qiudao (求道) card information

-- Add qiudao card related fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qiudaoDateSolar" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qiudaoDateLunar" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qiudaoHour" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qiudaoTemple" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qiudaoTanzhu" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "affiliation" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dianChuanShi" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yinShi" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "baoShi" TEXT;

-- Comments for documentation
COMMENT ON COLUMN "User"."qiudaoDateSolar" IS '求道日期（國曆）';
COMMENT ON COLUMN "User"."qiudaoDateLunar" IS '求道日期（農曆）';
COMMENT ON COLUMN "User"."qiudaoHour" IS '求道時辰（子丑寅卯辰巳午未申酉戌亥）';
COMMENT ON COLUMN "User"."qiudaoTemple" IS '求道佛堂';
COMMENT ON COLUMN "User"."qiudaoTanzhu" IS '壇主（姓名）';
COMMENT ON COLUMN "User"."affiliation" IS '所屬單位';
COMMENT ON COLUMN "User"."dianChuanShi" IS '點傳師';
COMMENT ON COLUMN "User"."yinShi" IS '引師';
COMMENT ON COLUMN "User"."baoShi" IS '保師';
