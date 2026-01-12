import { Site } from "./ui";

export const siteHomeHref = (site?: Site, unitSlug?: string) => {
  if (unitSlug && (site === Site.Class || site === Site.Work)) {
    return `/${site}/${unitSlug}`;
  }
  return `/${site}`;
};

export const siteActivityDetailHref = (
  site: Site,
  activityId: number,
  unitSlug?: string,
) => {
  if (unitSlug && (site === Site.Class || site === Site.Work)) {
    return `/${site}/${unitSlug}/activity/detail/${activityId}`;
  }
  return `/${site}/activity/detail/${activityId}`;
};

export const volunteerActivityEditHref = (activityId: number) =>
  `/volunteer/activity/edit/${activityId}`;

export const volunteerActivityCheckRecordHref = (activityId: number) =>
  `/volunteer/activity/checkrecord/${activityId}`;

export const lineShareHref = (url: string) =>
  `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
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
