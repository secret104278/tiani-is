import { Site } from "~/utils/ui";
import {
  buildActivityManageProcedure,
  buildActivityPublishedOnlyProcedure,
  buildActivityRepresentableProcedure,
  buildAdminProcedure,
  buildRepresentableProcedure,
} from "./utils";

export const activityManageProcedure = buildActivityManageProcedure(
  Site.Volunteer,
);

export const activityRepresentableProcedure =
  buildActivityRepresentableProcedure(Site.Volunteer);

export const activityPublishedOnlyProcedure =
  buildActivityPublishedOnlyProcedure(Site.Volunteer);

export const adminProcedure = buildAdminProcedure(Site.Volunteer);

export const representableProcedure = buildRepresentableProcedure(
  Site.Volunteer,
);
