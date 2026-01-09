import type { Site } from "./ui";

export const siteHomeHref = (site?: Site) => `/${site}`;

export const siteActivityDetailHref = (site: Site, activityId: number) =>
  `/${site}/activity/${activityId}/detail`;

export const lineShareHref = (url: string) =>
  `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;

export const newVolunteerActivityHref = () => "/volunteer/activity/new";
export const volunteerActivityDetailHref = (activityId: number) =>
  `/volunteer/activity/${activityId}/detail`;
export const volunteerActivityEditHref = (activityId: number) =>
  `/volunteer/activity/${activityId}/edit`;
export const volunteerActivityCheckRecordHref = (activityId: number) =>
  `/volunteer/activity/${activityId}/checkrecord`;
export const volunteerWorkingStatsHref = () => "/volunteer/workingstats";
export const volunteerAdminWorkingHref = () => "/volunteer/admin/working";
export const volunteerAdminWorkingUserDetailHref = (userId: string) =>
  `/volunteer/admin/working/${userId}`;

export const adminUsersHref = () => "/admin/users";
export const classAdminClassHref = () => "/class/admin/class";
export const personalAccountHref = () => "/personal/account";

// Tianishop navigation
export const tianishopListingDetailHref = (listingId: number) =>
  `/tianishop/listings/${listingId}`;
export const tianishopNewListingHref = () => "/tianishop/listings/new";
