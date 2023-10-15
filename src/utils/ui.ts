import type { VolunteerActivityStatus } from "@prisma/client";

export const getActivityStatusText = (status: VolunteerActivityStatus) => {
  switch (status) {
    case "DRAFT":
      return "草稿";
    case "INREVIEW":
      return "審核中";
    case "PUBLISHED":
      return "已發佈";
  }
};
