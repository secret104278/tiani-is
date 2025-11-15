/**
 * Query Cache Invalidation Helpers
 *
 * Provides centralized, type-safe cache invalidation for React Query via tRPC.
 * Use these helpers instead of manual refetch() calls for better cache management.
 *
 * Benefits:
 * - Automatic invalidation of related queries
 * - Type-safe invalidation patterns
 * - Consistent cache management across the app
 * - Better performance (invalidates only what's needed)
 *
 * Usage:
 * ```typescript
 * const utils = api.useUtils();
 *
 * // After creating a volunteer activity
 * invalidateActivities(utils, 'volunteer');
 *
 * // After updating a specific activity
 * invalidateActivities(utils, 'volunteer', activityId);
 * ```
 */

import type { api } from "~/utils/api";

export type ActivityType = "volunteer" | "class" | "etogether" | "yidework";
export type ApiUtils = ReturnType<typeof api.useUtils>;

/**
 * Invalidate activity-related queries
 *
 * @param utils - tRPC utils instance
 * @param type - Activity type (volunteer, class, etogether, yidework)
 * @param activityId - Optional specific activity ID
 */
export async function invalidateActivities(
  utils: ApiUtils,
  type: ActivityType,
  activityId?: number,
) {
  const routerMap = {
    volunteer: utils.volunteerActivity,
    class: utils.classActivity,
    etogether: utils.etogetherActivity,
    yidework: utils.yideworkActivity,
  };

  const router = routerMap[type];

  // Invalidate list queries (includes infinite queries)
  await router.getAll.invalidate();
  await router.getAllInfinite.invalidate();

  // Invalidate specific activity if ID provided
  if (activityId) {
    await router.getActivity.invalidate({ id: activityId });
  }

  // Invalidate stats (working, registered users, etc.)
  if ("getWorkingStats" in router) {
    await router.getWorkingStats.invalidate();
  }
  if ("getRegisteredUsers" in router) {
    await router.getRegisteredUsers.invalidate();
  }
}

/**
 * Invalidate user-related queries
 *
 * @param utils - tRPC utils instance
 * @param userId - Optional specific user ID
 */
export async function invalidateUsers(utils: ApiUtils, userId?: string) {
  await utils.user.getAll.invalidate();

  if (userId) {
    await utils.user.getUserProfile.invalidate({ userId });
  }

  // Also invalidate current user profile
  await utils.user.getCurrentUserProfile.invalidate();
}

/**
 * Invalidate check-in/registration queries for an activity
 *
 * @param utils - tRPC utils instance
 * @param type - Activity type
 * @param activityId - Activity ID
 */
export async function invalidateActivityRegistrations(
  utils: ApiUtils,
  type: ActivityType,
  activityId: number,
) {
  const routerMap = {
    volunteer: utils.volunteerActivity,
    class: utils.classActivity,
    etogether: utils.etogetherActivity,
    yidework: utils.yideworkActivity,
  };

  const router = routerMap[type];

  // Invalidate type-specific queries
  if (type === "class") {
    await utils.classActivity.getActivityCheckRecords.invalidate({
      activityId,
    });
  }

  if (type === "volunteer") {
    await utils.volunteerActivity.getActivityCheckRecords.invalidate({
      activityId,
    });
  }

  if (type === "etogether") {
    await utils.etogetherActivity.getActivityWithRegistrations.invalidate({
      activityId,
    });
    await utils.etogetherActivity.getRegister.invalidate({ activityId });
  }

  if (type === "yidework") {
    await utils.yideworkActivity.getActivityWithRegistrations.invalidate({
      activityId,
    });
    await utils.yideworkActivity.getRegister.invalidate({ activityId });
  }

  // Invalidate common registration-related queries
  if ("getRegisteredUsers" in router) {
    await router.getRegisteredUsers.invalidate({ activityId });
  }
  if ("getWorkingStats" in router) {
    await router.getWorkingStats.invalidate({ activityId });
  }

  // Also invalidate the activity itself (registration counts may change)
  await router.getActivity.invalidate({ id: activityId });
}

/**
 * Invalidate TianiShop cart and related queries
 *
 * @param utils - tRPC utils instance
 */
export async function invalidateCart(utils: ApiUtils) {
  await utils.tianiShop.getCart.invalidate();
  await utils.tianiShop.getCartItemCount.invalidate();
}

/**
 * Invalidate TianiShop listing queries
 *
 * @param utils - tRPC utils instance
 * @param listingId - Optional specific listing ID
 */
export async function invalidateListings(
  utils: ApiUtils,
  listingId?: string,
) {
  await utils.tianiShop.getAllListings.invalidate();
  await utils.tianiShop.getMyListings.invalidate();

  if (listingId) {
    await utils.tianiShop.getListing.invalidate({ listingId });
  }
}

/**
 * Invalidate all queries (use sparingly, only when necessary)
 *
 * @param utils - tRPC utils instance
 */
export async function invalidateAll(utils: ApiUtils) {
  await utils.invalidate();
}
