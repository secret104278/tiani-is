export interface UserRole {
  is_tiani_admin: boolean;
  is_volunteer_admin: boolean;
  is_yideclass_admin: boolean;
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

export interface ActivityCheckInHistory {
  checkInAt: Date;
  checkOutAt: Date;
  activityId: number;
  title: string;
  startDateTime: Date;
}

export interface CasualCheckInHistory {
  id: number;
  checkInAt: Date;
  checkOutAt: Date | null;
}

export interface CheckRecord {
  checkInAt?: Date;
  checkOutAt?: Date;
  userName: string;
  userId: string;
  activityId: number;
  // photo?: string;
}
