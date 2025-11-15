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

  // Invalidate list queries (infinite queries)
  await router.getAllActivitiesInfinite.invalidate();

  // Invalidate specific activity if ID provided
  if (activityId) {
    await router.getActivity.invalidate({ id: activityId });
  }

  // Class-specific: invalidate title search
  if (type === "class") {
    await utils.classActivity.getActivitiesByTitle.invalidate();
  }
}

/**
 * Invalidate user-related queries
 *
 * @param utils - tRPC utils instance
 */
export async function invalidateUsers(utils: ApiUtils) {
  // Invalidate current user profile
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
  // Always invalidate the activity itself first (counts, status, etc.)
  const routerMap = {
    volunteer: utils.volunteerActivity,
    class: utils.classActivity,
    etogether: utils.etogetherActivity,
    yidework: utils.yideworkActivity,
  };

  const router = routerMap[type];
  await router.getActivity.invalidate({ id: activityId });

  // Invalidate type-specific queries
  if (type === "class") {
    // Check-in records table
    await utils.classActivity.getActivityCheckRecords.invalidate({
      activityId,
    });
    // Working stats (hours, counts) - no parameters
    await utils.classActivity.getWorkingStats.invalidate();
    // Check-in status for current user
    await utils.classActivity.isCheckedIn.invalidate({ activityId });
    // Leave records
    await utils.classActivity.getActivityLeaveRecords.invalidate({
      activityId,
    });
    // Leave status for current user
    await utils.classActivity.isLeaved.invalidate({ activityId });
    // Class member enrollments
    await utils.classActivity.getClassMemberEnrollments.invalidate();
  }

  if (type === "volunteer") {
    // Check-in records table
    await utils.volunteerActivity.getActivityCheckRecords.invalidate({
      activityId,
    });
    // Working stats (hours, counts) - no parameters
    await utils.volunteerActivity.getWorkingStats.invalidate();
    // Users with working stats by check-in - invalidate all (date-based query)
    await utils.volunteerActivity.getUsersWithWorkingStatsByCheckIn.invalidate();
    // Check-in activity history - no parameters
    await utils.volunteerActivity.getCheckInActivityHistory.invalidate();
    // Latest casual check-in - no parameters
    await utils.volunteerActivity.getLatestCasualCheckIn.invalidate();
  }

  if (type === "etogether") {
    // Activity with all registrations (main view)
    await utils.etogetherActivity.getActivityWithRegistrations.invalidate({
      activityId,
    });
    // Current user's registration status
    await utils.etogetherActivity.getRegister.invalidate({ activityId });
    // Check record for user
    await utils.etogetherActivity.getCheckRecord.invalidate({ activityId });
  }

  if (type === "yidework") {
    // Activity with all registrations (main view)
    await utils.yideworkActivity.getActivityWithRegistrations.invalidate({
      activityId,
    });
    // Current user's registration status
    await utils.yideworkActivity.getRegister.invalidate({ activityId });
  }
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
export async function invalidateListings(utils: ApiUtils, listingId?: number) {
  await utils.tianiShop.getMyListings.invalidate();

  if (listingId) {
    await utils.tianiShop.getListing.invalidate({ id: listingId });
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
