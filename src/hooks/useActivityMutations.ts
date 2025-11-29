/**
 * Activity Mutation Hooks
 *
 * Provides reusable mutation hooks for activity CRUD operations with:
 * - Automatic cache invalidation
 * - Consistent error handling
 * - Type-safe operations
 * - Unified create/update logic
 *
 * Usage:
 * ```typescript
 * const { createActivity, updateActivity, deleteActivity, isPending } =
 *   useActivityMutations('volunteer');
 *
 * // Create
 * createActivity(formData, {
 *   onSuccess: (activity) => router.push(`/volunteer/activity/detail/${activity.id}`)
 * });
 *
 * // Update
 * updateActivity({ activityId: 123, ...formData });
 * ```
 */

import { useRouter } from "next/router";
import {
  type ActivityType,
  invalidateActivities,
} from "~/lib/query/invalidation";
import { api } from "~/utils/api";

interface UseActivityMutationsOptions {
  /**
   * Callback after successful creation
   */
  onCreateSuccess?: (activity: { id: number }) => void;

  /**
   * Callback after successful update
   */
  onUpdateSuccess?: (activity: { id: number }) => void;

  /**
   * Callback after successful deletion
   */
  onDeleteSuccess?: () => void;

  /**
   * Automatically navigate to activity detail page after create/update
   * @default true
   */
  autoNavigate?: boolean;
}

/**
 * Hook for managing activity mutations (create, update, delete)
 *
 * @param type - Activity type (volunteer, class, etogether, yidework)
 * @param options - Optional callbacks and configuration
 */
export function useActivityMutations(
  type: ActivityType,
  options: UseActivityMutationsOptions = {},
) {
  const {
    onCreateSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
    autoNavigate = true,
  } = options;
  const router = useRouter();
  const utils = api.useUtils();

  // Build the router path based on type
  const getDetailPath = (id: number) => {
    const pathMap = {
      volunteer: `/volunteer/activity/detail/${id}`,
      class: `/yideclass/activity/detail/${id}`,
      etogether: `/etogether/activity/detail/${id}`,
      yidework: `/yidework/activity/detail/${id}`,
    };
    return pathMap[type];
  };

  // Get the correct API router based on type
  const getApiRouter = () => {
    const routerMap = {
      volunteer: api.volunteerActivity,
      class: api.classActivity,
      etogether: api.etogetherActivity,
      yidework: api.yideworkActivity,
    };
    return routerMap[type];
  };

  const apiRouter = getApiRouter();

  // Create mutation
  const createMutation = apiRouter.createActivity.useMutation({
    onSuccess: async (data) => {
      // Invalidate relevant queries
      await invalidateActivities(utils, type);

      // Custom callback
      onCreateSuccess?.(data);

      // Auto navigation
      if (autoNavigate) {
        void router.push(getDetailPath(data.id));
      }
    },
  });

  // Update mutation
  const updateMutation = apiRouter.updateActivity.useMutation({
    onSuccess: async (data) => {
      // Invalidate relevant queries (including the specific activity)
      await invalidateActivities(utils, type, data.id);

      // Custom callback
      onUpdateSuccess?.(data);

      // Auto navigation
      if (autoNavigate) {
        void router.push(getDetailPath(data.id));
      }
    },
  });

  // Delete mutation
  const deleteMutation = apiRouter.deleteActivity.useMutation({
    onSuccess: async () => {
      // Invalidate list queries
      await invalidateActivities(utils, type);

      // Custom callback
      onDeleteSuccess?.();

      // Navigate to list page
      if (autoNavigate) {
        const listPathMap = {
          volunteer: "/volunteer",
          class: "/yideclass",
          etogether: "/etogether",
          yidework: "/yidework",
        };
        void router.push(listPathMap[type]);
      }
    },
  });

  return {
    // Mutation functions
    createActivity: createMutation.mutate,
    updateActivity: updateMutation.mutate,
    deleteActivity: deleteMutation.mutate,

    // Async versions
    createActivityAsync: createMutation.mutateAsync,
    updateActivityAsync: updateMutation.mutateAsync,
    deleteActivityAsync: deleteMutation.mutateAsync,

    // Loading states
    isPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Error states
    error: createMutation.error || updateMutation.error || deleteMutation.error,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,

    // Success states
    isSuccess:
      createMutation.isSuccess ||
      updateMutation.isSuccess ||
      deleteMutation.isSuccess,
    createSuccess: createMutation.isSuccess,
    updateSuccess: updateMutation.isSuccess,
    deleteSuccess: deleteMutation.isSuccess,

    // Reset functions
    reset: () => {
      createMutation.reset();
      updateMutation.reset();
      deleteMutation.reset();
    },
  };
}

/**
 * Convenience hooks for specific activity types
 */
export const useVolunteerMutations = (options?: UseActivityMutationsOptions) =>
  useActivityMutations("volunteer", options);

export const useClassMutations = (options?: UseActivityMutationsOptions) =>
  useActivityMutations("class", options);

export const useEtogetherMutations = (options?: UseActivityMutationsOptions) =>
  useActivityMutations("etogether", options);

export const useYideWorkMutations = (options?: UseActivityMutationsOptions) =>
  useActivityMutations("yidework", options);
