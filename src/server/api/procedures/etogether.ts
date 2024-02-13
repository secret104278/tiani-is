import { Site } from "~/utils/ui";
import {
  buildActivityManageProcedure,
  buildActivityPublishedOnlyProcedure,
  buildActivityRepresentableProcedure,
  buildAdminProcedure,
  buildRepresentableProcedure,
} from "./utils";

export const activityManageProcedure = buildActivityManageProcedure(
  Site.Etogether,
);

export const activityRepresentableProcedure =
  buildActivityRepresentableProcedure(Site.Etogether);

export const activityPublishedOnlyProcedure =
  buildActivityPublishedOnlyProcedure(Site.Etogether);

export const adminProcedure = buildAdminProcedure(Site.Etogether);

export const representableProcedure = buildRepresentableProcedure(
  Site.Etogether,
);
