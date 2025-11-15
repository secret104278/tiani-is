/**
 * Check-In and Registration Mutation Hooks
 *
 * Provides hooks for activity registration and check-in operations with:
 * - Automatic cache invalidation
 * - Proper cleanup (no more router.reload()!)
 * - Type-safe operations
 *
 * Usage:
 * ```typescript
 * const { register, checkIn, checkOut, isPending } =
 *   useCheckInMutations('volunteer', activityId);
 *
 * register({ userId: '123' });
 * checkIn({ userId: '123' });
 * ```
 */

import { useRouter } from "next/router";
import { api } from "~/utils/api";
import {
  invalidateActivityRegistrations,
  type ActivityType,
} from "~/lib/query/invalidation";

interface UseCheckInMutationsOptions {
  /**
   * Callback after successful operation
   */
  onSuccess?: () => void;

  /**
   * Close dialog/modal after success
   */
  onClose?: () => void;

  /**
   * Reload page after success (use sparingly, prefer cache invalidation)
   * @default false
   * @deprecated Use cache invalidation instead
   */
  reloadOnSuccess?: boolean;
}

/**
 * Hook for managing check-in and registration mutations
 *
 * @param type - Activity type
 * @param activityId - Activity ID
 * @param options - Optional callbacks and configuration
 */
export function useCheckInMutations(
  type: ActivityType,
  activityId: number,
  options: UseCheckInMutationsOptions = {},
) {
  const { onSuccess, onClose, reloadOnSuccess = false } = options;
  const router = useRouter();
  const utils = api.useUtils();

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

  // Shared success handler
  const handleSuccess = async () => {
    // Invalidate relevant queries
    await invalidateActivityRegistrations(utils, type, activityId);

    // Custom callback
    onSuccess?.();

    // Close dialog if provided
    onClose?.();

    // Reload if requested (deprecated pattern)
    if (reloadOnSuccess) {
      router.reload();
    }
  };

  // Register for activity
  const registerMutation = apiRouter.registerActivity.useMutation({
    onSuccess: handleSuccess,
  });

  // Check-in
  const checkInMutation = apiRouter.checkIn.useMutation({
    onSuccess: handleSuccess,
  });

  // Check-out
  const checkOutMutation = apiRouter.checkOut.useMutation({
    onSuccess: handleSuccess,
  });

  // Manual external register (for non-users)
  const manualRegisterMutation = apiRouter.manualExternalRegister?.useMutation({
    onSuccess: handleSuccess,
  });

  // Update check record
  const updateCheckRecordMutation = apiRouter.updateCheckRecord?.useMutation({
    onSuccess: handleSuccess,
  });

  return {
    // Mutation functions
    register: registerMutation.mutate,
    checkIn: checkInMutation.mutate,
    checkOut: checkOutMutation.mutate,
    manualRegister: manualRegisterMutation?.mutate,
    updateCheckRecord: updateCheckRecordMutation?.mutate,

    // Async versions
    registerAsync: registerMutation.mutateAsync,
    checkInAsync: checkInMutation.mutateAsync,
    checkOutAsync: checkOutMutation.mutateAsync,

    // Loading states
    isPending:
      registerMutation.isPending ||
      checkInMutation.isPending ||
      checkOutMutation.isPending ||
      manualRegisterMutation?.isPending ||
      updateCheckRecordMutation?.isPending,
    isRegistering: registerMutation.isPending,
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,

    // Error states
    error:
      registerMutation.error ||
      checkInMutation.error ||
      checkOutMutation.error ||
      manualRegisterMutation?.error ||
      updateCheckRecordMutation?.error,
    registerError: registerMutation.error,
    checkInError: checkInMutation.error,
    checkOutError: checkOutMutation.error,

    // Success states
    isSuccess:
      registerMutation.isSuccess ||
      checkInMutation.isSuccess ||
      checkOutMutation.isSuccess,

    // Reset
    reset: () => {
      registerMutation.reset();
      checkInMutation.reset();
      checkOutMutation.reset();
      manualRegisterMutation?.reset();
      updateCheckRecordMutation?.reset();
    },
  };
}
