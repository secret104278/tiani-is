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

export interface CheckInHistory {
  checkinat: Date;
  checkoutat: Date;
  activityId: number;
  title: string;
  startDateTime: Date;
}
