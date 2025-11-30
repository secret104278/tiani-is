# E2E Testing Guidelines

This document outlines the conventions and best practices for writing E2E tests across all modules in the Tiani-IS application.

## Project Structure

```
e2e/
├── admin/                       # Admin module tests
│   ├── admin-permissions.spec.ts
│   ├── create-user.spec.ts
│   ├── profile.spec.ts
│   ├── roles.spec.ts
│   └── users.spec.ts
├── etogether/                   # Etogether module tests
│   ├── activity-flow.spec.ts
│   ├── activity-management.spec.ts
│   ├── authorization.spec.ts
│   ├── check-in.spec.ts
│   └── registration.spec.ts
├── volunteer/                   # Volunteer module tests
│   ├── activity-management.spec.ts
│   ├── authorization.spec.ts
│   ├── check-in.spec.ts
│   ├── registration.spec.ts
│   ├── stats.spec.ts
│   └── ui-interactions.spec.ts
├── yideclass/                   # YiDeClass module tests
│   ├── attendance.spec.ts
│   ├── class-management.spec.ts
│   └── enrollment.spec.ts
├── utils/
│   ├── auth-helpers.ts          # Authentication utilities
│   └── volunteer-helpers.ts     # Module-specific helpers
├── auth.setup.ts                # Default auth setup
└── seed.spec.ts                 # Database seeding
```

## Application Modules

| Module | Route Prefix | Description |
|--------|--------------|-------------|
| Admin | `/admin` | User management, role assignment |
| Volunteer | `/volunteer` | Volunteer activities and check-ins |
| YiDeClass | `/yideclass` | Class management and attendance |
| Etogether | `/etogether` | Group activities and registration |
| TianiShop | `/tianishop` | Shop and orders (App Router) |

## Test File Organization

### Naming Convention
- Use descriptive kebab-case names: `activity-management.spec.ts`
- Group tests by module in separate directories
- Group related tests by feature within each module

### Test Structure
```typescript
import { expect, test } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something specific", async ({ page }) => {
    // Arrange - setup test data
    // Act - perform actions
    // Assert - verify results
  });
});
```

## Authentication

### Default User
The default authenticated user (set up in `auth.setup.ts`) has all admin roles:
- `TIANI_ADMIN`
- `VOLUNTEER_ADMIN`
- `YIDECLASS_ADMIN`
- `ETOGETHER_ADMIN`
- `YIDEWORK_ADMIN`

This user is automatically available via the stored auth state.

### Custom Roles with `loginAs()`
Use `loginAs()` when testing authorization or role-specific behavior:

```typescript
import { Role } from "@prisma/client";
import { loginAs } from "../utils/auth-helpers";

// Test with no roles (regular user)
test("should restrict access for non-admin", async ({ page, context }) => {
  await loginAs(context, []);
  await page.goto("/admin/users");
  await expect(page.getByRole("table")).not.toBeVisible();
});

// Test with specific role
test("should allow admin access", async ({ page, context }) => {
  await loginAs(context, [Role.TIANI_ADMIN]);
  await page.goto("/admin/users");
  await expect(page.getByRole("table")).toBeVisible();
});
```

### When Using Browser Context
For tests that need fresh browser contexts:

```typescript
test("custom auth test", async ({ browser }) => {
  const context = await browser.newContext();
  await loginAs(context, [Role.VOLUNTEER_ADMIN]);
  const page = await context.newPage();
  
  // Test logic
  
  await context.close();  // Always clean up!
});
```

### Available Roles
```typescript
Role.TIANI_ADMIN       // System-wide admin
Role.VOLUNTEER_ADMIN   // Volunteer module admin
Role.YIDECLASS_ADMIN   // YiDeClass module admin
Role.ETOGETHER_ADMIN   // Etogether module admin
Role.YIDEWORK_ADMIN    // YiDeWork module admin
[]                     // Regular user (no special permissions)
```

## Selector Best Practices

### Prefer Role-Based Selectors
```typescript
// ✅ Preferred - accessible and stable
await page.getByRole("button", { name: "報名" }).click();
await page.getByRole("heading", { name: "確認撤銷" });
await page.getByRole("link", { name: "建立新工作" });
await page.getByRole("columnheader", { name: "姓名" });
await page.getByRole("checkbox").nth(1);
await page.getByRole("textbox").fill("value");

// ✅ For form inputs with name attribute
await page.fill('input[name="location"]', "value");
await page.locator('select[name="title"]').selectOption({ index: 1 });

// ⚠️ Use when role selectors aren't sufficient
await page.locator(".card", { hasText: "日常工作" });
await page.locator(".avatar.btn").click();
```

### Exact Matching
Use `exact: true` to avoid partial matches:

```typescript
// Matches "取消報名" but not "取消"
await page.getByRole("button", { name: "取消報名" }).click();

// Only matches exactly "取消"
await page.getByRole("button", { name: "取消", exact: true }).click();

// Only matches exactly "報名"
await page.getByRole("button", { name: "報名", exact: true }).click();
```

### Row and Table Selectors
```typescript
// Find a specific row
const userRow = page.getByRole("row", { name: "Test User" });
await userRow.getByRole("checkbox").click();

// Find row with multiple conditions
const row = page
  .getByRole("row", { name: /2024\/01\/01/ })
  .filter({ hasText: "日常工作" })
  .filter({ hasText: "10:00" });

// Table assertions
await expect(page.locator("tbody tr")).not.toHaveCount(0);
await expect(page.locator("table")).toContainText("E2E");
```

## Test Isolation

### Each Test Should Be Independent
```typescript
// ✅ Good - creates its own data
test("should edit activity", async ({ page }) => {
  const { id } = await createActivity(page);
  await page.getByRole("button", { name: "編輯" }).click();
  // ...
});

// ❌ Bad - relies on external state
test("should edit activity", async ({ page }) => {
  await page.goto("/volunteer/activity/detail/123");
  // ...
});
```

### Unique Identifiers for Parallel Tests
Use worker-specific identifiers to avoid conflicts:

```typescript
const workerIndex = test.info().workerIndex ?? 0;
const uniqueName = `Test User ${Date.now()}-w${workerIndex}`;
```

Or use helper functions:
```typescript
import { getWorkerSpecificTestUserId } from "../utils/volunteer-helpers";
const testUserId = getWorkerSpecificTestUserId();
```

### Serial Tests for Shared State
Use `test.describe.serial` when tests must share state:

```typescript
test.describe.serial("Authorization Tests", () => {
  let activityId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    await loginAs(context, [Role.TIANI_ADMIN]);
    const page = await context.newPage();
    
    // Create shared test data
    const { id } = await createActivity(page);
    activityId = id;
    
    await context.close();
  });

  test("first test uses shared data", async ({ browser }) => {
    // Uses activityId
  });

  test("second test uses same data", async ({ browser }) => {
    // Uses activityId
  });
});
```

## Admin vs Non-Admin Testing

Many pages display differently based on user roles. Always test both perspectives:

```typescript
test.describe("Activity Management", () => {
  test("admin can see management buttons", async ({ page }) => {
    // Default user is admin
    await page.goto(`/volunteer/activity/detail/${activityId}`);
    await expect(page.getByRole("button", { name: "編輯" })).toBeVisible();
    await expect(page.getByRole("button", { name: "撤銷" })).toBeVisible();
  });

  test("non-admin cannot see management buttons", async ({ page, context }) => {
    await loginAs(context, []);
    await page.goto(`/volunteer/activity/detail/${activityId}`);
    await expect(page.getByRole("button", { name: "編輯" })).toBeHidden();
    await expect(page.getByRole("button", { name: "撤銷" })).toBeHidden();
  });
});
```

## Common Patterns

### Waiting for Network Responses
Wait for API responses when actions trigger data changes:

```typescript
const responsePromise = page.waitForResponse(
  (response) =>
    response.url().includes("volunteerActivity.getAllActivitiesInfinite") &&
    response.status() === 200,
);
await page.getByLabel("我發起的").check();
await responsePromise;
```

### Handling Dialogs
Always verify dialog visibility before interacting:

```typescript
await page.getByRole("button", { name: "撤銷" }).click();
await expect(page.getByRole("heading", { name: "確認撤銷" })).toBeVisible();
await page
  .getByRole("dialog")
  .getByRole("button", { name: "撤銷", exact: true })
  .click();
```

### Testing Form Validation
```typescript
test("should show validation error", async ({ page }) => {
  await page.fill('input[name="checkInAt"]', "2024-01-01T23:00");
  await page.fill('input[name="checkOutAt"]', "2024-01-01T10:00");
  await page.getByRole("button", { name: "確認" }).click();
  
  await expect(
    page.getByRole("button", { name: "簽退時間必須晚於簽到時間" }),
  ).toBeVisible();
});
```

### Testing 404 Pages
```typescript
test("should handle non-existent resource", async ({ page }) => {
  await page.goto("/volunteer/activity/detail/99999");
  await expect(page.getByText("This page could not be found")).toBeVisible();
});
```

### Testing Status Transitions
```typescript
test("should transition from draft to published", async ({ page }) => {
  await createActivity(page, { isDraft: true });
  await expect(page.getByText("草稿")).toBeVisible();
  
  await page.getByRole("button", { name: "送出申請" }).click();
  await expect(page.getByText("審核中")).toBeVisible();
  
  await page.getByRole("button", { name: "核准" }).click();
  await expect(page.getByText("已發佈")).toBeVisible();
});
```

### Testing URL Navigation
```typescript
test("should navigate to detail page", async ({ page }) => {
  await page.getByRole("button", { name: "送出" }).click();
  await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);
});
```

### Testing List/Table Content
```typescript
test("should display user list", async ({ page }) => {
  await page.goto("/admin/users");
  
  const headers = ["姓名", "最高 管理者", "個人資料"];
  for (const header of headers) {
    await expect(
      page.getByRole("columnheader", { name: header }),
    ).toBeVisible();
  }
  
  await expect(page.locator("tbody tr")).not.toHaveCount(0);
});
```

## Creating Helper Functions

When patterns repeat across tests, create module-specific helpers:

```typescript
// e2e/utils/volunteer-helpers.ts
export async function createActivity(page: Page, options = {}) {
  const { location, offsetHours = 1, isDraft = false } = options;
  
  await page.goto("/volunteer/activity/new");
  // Fill form...
  await page.getByRole("button", { name: isDraft ? "保存草稿" : "送出" }).click();
  
  await expect(page).toHaveURL(/\/volunteer\/activity\/detail\/\d+/);
  return { id: page.url().split("/").pop()!, location };
}
```

Helper function guidelines:
- Place in `e2e/utils/` directory
- Name file after the module: `volunteer-helpers.ts`, `etogether-helpers.ts`
- Export functions that handle common multi-step operations
- Return useful data (IDs, created values) for subsequent assertions

## Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run specific module
pnpm test:e2e e2e/volunteer/
pnpm test:e2e e2e/admin/

# Run specific file
pnpm test:e2e e2e/volunteer/registration.spec.ts

# Run with UI mode
pnpm test:e2e --ui

# Run with headed browser
pnpm test:e2e --headed

# Debug mode
pnpm test:e2e --debug
```

## Debugging Tips

1. **Use `page.pause()`** to stop execution and inspect the page
2. **Use `--headed`** to see the browser during test execution
3. **Check `playwright-report/`** for detailed test reports with screenshots
4. **Use `test.only()`** to run a single test during development (remove before commit)
5. **Use `await page.screenshot({ path: 'debug.png' })`** to capture state
6. **Check network tab** in Playwright UI for API response issues

## Test Database

Tests run against a local PostgreSQL database. The `seed-test-user.ts` script:
- Creates test users for parallel workers (`e2e-test-user-id-w0` through `w9`)
- Assigns all admin roles to test users
- Cleans up check-in records for a fresh state
- Creates session tokens for authentication

## Checklist for New Tests

- [ ] Test is independent and doesn't rely on external state
- [ ] Uses helper functions for common operations
- [ ] Uses role-based selectors where possible
- [ ] Tests both admin and non-admin views if applicable
- [ ] Cleans up browser contexts when using custom auth
- [ ] Uses unique identifiers to avoid parallel test conflicts
- [ ] Waits for network responses when needed
- [ ] Includes meaningful assertions
- [ ] Follows existing patterns in the module

## Module-Specific Notes

### Admin Module
- Tests user management and role assignment
- Always test permission boundaries (admin vs non-admin access)

### Volunteer Module
- Has comprehensive helper functions in `volunteer-helpers.ts`
- Includes casual check-in and activity check-in flows
- Test both draft and published activity states

### YiDeClass Module
- Tests class creation, attendance, and enrollment
- Uses dropdowns for title/location selection

### Etogether Module
- Tests activity creation with subgroups
- Registration flow includes subgroup selection

