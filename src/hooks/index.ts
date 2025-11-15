/**
 * Custom Hooks Index
 *
 * Centralized export for all custom React hooks in the application.
 * These hooks encapsulate common patterns and reduce boilerplate.
 */

// Activity mutation hooks
export {
  useActivityMutations,
  useVolunteerMutations,
  useClassMutations,
  useEtogetherMutations,
  useYideWorkMutations,
  type ActivityType,
} from "./useActivityMutations";

// Check-in and registration hooks
export { useCheckInMutations } from "./useCheckInMutations";

// Query invalidation utilities (re-export for convenience)
export {
  invalidateActivities,
  invalidateUsers,
  invalidateActivityRegistrations,
  invalidateCart,
  invalidateListings,
  invalidateAll,
  type ApiUtils,
} from "~/lib/query/invalidation";
