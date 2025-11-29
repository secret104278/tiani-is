# Admin User Management Test Plan

## Application Overview

This test plan covers the comprehensive operations of the Admin User Management interface, including listing users, creating offline users, managing roles, and updating user profiles with Tao-specific information.

## Test Scenarios

### 1. User List & Display

**Seed:** `e2e/seed.spec.ts`

#### 1.1. should display user list correctly

**File:** `e2e/admin/users.spec.ts`

**Steps:**
  1. Navigate to /admin/users
  2. Verify page title and layout
  3. Verify table columns: Name, Roles (Super, Tiani, Yide Class, Yide Dao, Activity), Profile
  4. Verify existence of seeded test user

**Expected Results:**
  - Page title "帳號管理" is visible
  - User table is displayed with correct columns
  - "E2E Test User" is visible in the list
  - "新增帳號" (Add Account) button is visible

### 2. User Creation

**Seed:** `e2e/seed.spec.ts`

#### 2.1. should create a new offline user

**File:** `e2e/admin/create-user.spec.ts`

**Steps:**
  1. Click "新增帳號" button
  2. Verify warning message about offline usage
  3. Enter name "Test User B"
  4. Click "建立" (Create)
  5. Verify "Test User B" is added to the list

**Expected Results:**
  - "新增帳號" dialog appears with warning message
  - New user appears in the table after creation

### 3. Role Management

**Seed:** `e2e/seed.spec.ts`

#### 3.1. should assign and revoke roles

**File:** `e2e/admin/roles.spec.ts`

**Steps:**
  1. Identify a target user (e.g., "Test User B")
  2. Click "Tiani Volunteer Admin" checkbox to assign role
  3. Verify checkbox is checked
  4. Reload page
  5. Verify checkbox remains checked
  6. Click checkbox again to revoke role
  7. Verify checkbox is unchecked

**Expected Results:**
  - Checkbox state changes upon clicking
  - Role assignment is persisted (reload page to verify)

### 4. Profile Management

**Seed:** `e2e/seed.spec.ts`

#### 4.1. should update user profile Tao information

**File:** `e2e/admin/profile.spec.ts`

**Steps:**
  1. Click "Profile" (個人資料) button for a user
  2. Fill in Tao Initiation Date (e.g., "2023-01-01")
  3. Select Time (e.g., "子時")
  4. Fill in Temple, Host, Unit, Transmitter, Introducer, Guarantor
  5. Click "儲存" (Save)
  6. Reload page and open profile again
  7. Verify all fields match the entered values

**Expected Results:**
  - Profile dialog opens with user name
  - All fields can be filled and saved
  - Saved data persists after reload
