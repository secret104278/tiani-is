export interface UserRole {
  is_tiani_admin: boolean;
  is_volunteer_admin: boolean;
  is_class_admin: boolean;
  is_etogether_admin: boolean;
  is_yidework_admin: boolean;
  is_tianishop_admin: boolean;
}

export type VolunteerActivityTopics = VolunteerActivityTopic[];
export interface VolunteerActivityTopic {
  topic: string;
  options: string[];
}

export interface OGMetaProps {
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
}

export interface CheckRecord {
  user: {
    name: string | null;
    id: string;
  };
  activityId: number;
  checkInAt: Date;
  checkOutAt: Date | null;
}

export interface YideWorkAssignments {
  generalConvener?: string;
  expoundingTao?: string;
  conductor?: string;
  documentPresentation?: string;
  offering?: {
    upper?: string;
    lower?: string;
  };
  kneelingReception?: {
    upper?: string;
    lower?: string;
  };
  servingFruit?: string;
  arrangingFruit?: string;
  invokingAltar?: {
    upper?: string;
    lower?: string;
  };
  accompanyingAltar?: string;
  performingCeremony?: {
    upper?: string;
    lower?: string;
  };
  guardingAltar?: string;
  transmittingMasterService?: string;
  towelsAndTea?: string;
  threeTreasures?: string;
}
