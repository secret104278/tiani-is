import { Site } from "~/utils/ui";
import {
  buildActivityManageProcedure,
  buildActivityPublishedOnlyProcedure,
  buildActivityRepresentableProcedure,
  buildAdminProcedure,
  buildRepresentableProcedure,
} from "./utils";

export const activityManageProcedure = buildActivityManageProcedure(Site.Work);

export const activityRepresentableProcedure =
  buildActivityRepresentableProcedure(Site.Work);

export const activityPublishedOnlyProcedure =
  buildActivityPublishedOnlyProcedure(Site.Work);

export const adminProcedure = buildAdminProcedure(Site.Work);

export const representableProcedure = buildRepresentableProcedure(Site.Work);
