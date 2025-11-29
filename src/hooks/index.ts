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
} from "./useActivityMutations";

// Query invalidation utilities (re-export for convenience)
export {
  invalidateActivities,
  invalidateUsers,
  invalidateActivityRegistrations,
  invalidateCart,
  invalidateListings,
  invalidateAll,
  type ActivityType,
  type ApiUtils,
} from "~/lib/query/invalidation";
