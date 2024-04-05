import { Site } from "~/utils/ui";
import {
  buildActivityManageProcedure,
  buildActivityPublishedOnlyProcedure,
  buildActivityRepresentableProcedure,
  buildAdminProcedure,
  buildRepresentableProcedure,
} from "./utils";

export const activityManageProcedure = buildActivityManageProcedure(
  Site.YideWork,
);

export const activityRepresentableProcedure =
  buildActivityRepresentableProcedure(Site.YideWork);

export const activityPublishedOnlyProcedure =
  buildActivityPublishedOnlyProcedure(Site.YideWork);

export const adminProcedure = buildAdminProcedure(Site.YideWork);

export const representableProcedure = buildRepresentableProcedure(
  Site.YideWork,
);
