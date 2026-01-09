import { Site } from "~/utils/ui";
import {
  buildActivityManageProcedure,
  buildActivityPublishedOnlyProcedure,
  buildActivityRepresentableProcedure,
  buildAdminProcedure,
  buildRepresentableProcedure,
} from "./utils";

export const activityManageProcedure = buildActivityManageProcedure(Site.Class);

export const activityRepresentableProcedure =
  buildActivityRepresentableProcedure(Site.Class);

export const activityPublishedOnlyProcedure =
  buildActivityPublishedOnlyProcedure(Site.Class);

export const adminProcedure = buildAdminProcedure(Site.Class);

export const representableProcedure = buildRepresentableProcedure(Site.Class);
