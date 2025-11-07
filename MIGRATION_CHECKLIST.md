# Qiudao Card Fields Migration Checklist

## Overview
This checklist ensures all parts of the application are correctly updated for the qiudao card feature.

## Database Schema ✅
**File:** `prisma/schema.prisma`

User model includes:
- [x] `qiudaoDateSolar` (DateTime?) - 求道日期（國曆）
- [x] `qiudaoDateLunar` (String?) - 求道日期（農曆）
- [x] `qiudaoHour` (String?) - 求道時辰
- [x] `qiudaoTemple` (String?) - 求道佛堂
- [x] `qiudaoTanzhu` (String?) - 壇主（姓名）
- [x] `affiliation` (String?) - 所屬單位
- [x] `dianChuanShi` (String?) - 點傳師
- [x] `yinShi` (String?) - 引師
- [x] `baoShi` (String?) - 保師

## Backend (tRPC API) ✅
**File:** `src/server/api/routers/user.ts`

### 1. updateQiudaoInfo (Line 64-95)
- [x] Input validation includes all 9 qiudao fields
- [x] Mutation updates all 9 fields in database
- [x] Uses protectedProcedure (user can update their own data)

### 2. updateUserQiudaoInfo (Line 97-128)
- [x] Input validation includes all 9 qiudao fields
- [x] Mutation updates all 9 fields in database
- [x] Uses allAdminRepresentableProcedure (admin can update any user)

### 3. getUser (Line 145-165)
- [x] Select includes all 9 qiudao fields
- [x] Returns data for admin to view

## Frontend Components ✅

### 1. QiudaoLunarDisplay Component
**File:** `src/components/QiudaoLunarDisplay.tsx`
- [x] Displays lunar date calculated from solar date
- [x] Hour selector for 12 earthly branches (地支)
- [x] Simplified styling with input-bordered
- [x] Proper ordering: Hour selector → Lunar display

### 2. Personal Account Page
**File:** `src/pages/personal/account.tsx`
- [x] Form includes qiudaoHour state
- [x] handleFormSubmit sends qiudaoHour to API (Line 95)
- [x] Uses QiudaoLunarDisplay component (Line 171-175)

### 3. Admin Users Page
**File:** `src/pages/admin/users.tsx`
- [x] Form includes qiudaoHour state
- [x] Load qiudaoHour from user data (Line 136)
- [x] Submit qiudaoHour to API (Line 240)
- [x] Uses QiudaoLunarDisplay component (Line 164-168)

## Type Safety ✅
All interfaces and types are properly aligned:
- Prisma schema types
- Zod validation schemas
- TypeScript frontend types
- tRPC router type exports

## Migration Instructions

### For Development:
```bash
# Generate and apply migration
npx prisma migrate dev --name add_qiudao_fields

# Generate Prisma Client
npx prisma generate
```

### For Production:
```bash
# Review the migration SQL
cat prisma/migrations/add_qiudao_fields.sql

# Apply migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Manual SQL (if needed):
```sql
-- Run the migration script directly
\i prisma/migrations/add_qiudao_fields.sql
```

## Testing Checklist

### User Flow:
- [ ] User can select solar date
- [ ] User can select hour (時辰)
- [ ] Lunar date displays automatically
- [ ] Format shows: "丁酉 八月 四日 子時"
- [ ] Data saves successfully
- [ ] Data persists after page reload

### Admin Flow:
- [ ] Admin can view any user's qiudao data
- [ ] Admin can edit any user's qiudao data
- [ ] Changes save successfully
- [ ] Changes reflect in user's profile

## Validation Summary

### Database ✅
- Schema correctly defines all 9 fields as nullable
- All fields use appropriate types

### Backend ✅
- Both user and admin APIs support all fields
- Proper authorization (protectedProcedure vs allAdminRepresentableProcedure)
- Type-safe Zod validation

### Frontend ✅
- Proper state management for qiudaoHour
- Correct data flow to API mutations
- Component displays data correctly
- User experience is intuitive (input order)

## Known Dependencies
- `lunisolar` library for lunar calendar conversion
- All qiudao fields are optional (nullable)
- Frontend state properly synchronized with backend

## Status: ✅ READY FOR MIGRATION
All code is correctly aligned. Only database migration is needed.
