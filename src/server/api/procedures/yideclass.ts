import { Site } from "~/utils/ui";
import {
  buildActivityManageProcedure,
  buildActivityPublishedOnlyProcedure,
  buildActivityRepresentableProcedure,
  buildAdminProcedure,
  buildRepresentableProcedure,
} from "./utils";

export const activityManageProcedure = buildActivityManageProcedure(
  Site.Yideclass,
);

export const activityRepresentableProcedure =
  buildActivityRepresentableProcedure(Site.Yideclass);

export const activityPublishedOnlyProcedure =
  buildActivityPublishedOnlyProcedure(Site.Yideclass);

export const adminProcedure = buildAdminProcedure(Site.Yideclass);

export const representableProcedure = buildRepresentableProcedure(
  Site.Yideclass,
);
