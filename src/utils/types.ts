export interface UserRole {
  is_tiani_admin: boolean;
  is_volunteer_admin: boolean;
  is_yideclass_admin: boolean;
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
