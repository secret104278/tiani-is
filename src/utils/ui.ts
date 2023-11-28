import type { VolunteerActivityStatus } from "@prisma/client";
import { addHours } from "date-fns";
import type { VolunteerActivityTopics } from "./types";

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

export const VOLUNTEER_ACTIVITY_TOPIC_OTHER = "自行輸入";
export const VOLUNTEER_ACTIVITY_TOPICS: VolunteerActivityTopics = [
  {
    topic: "愿行服務",
    options: [
      "環境整理",
      "園藝維護",
      "環保回收",
      "烹飪料理",
      "揀菜備料",
      "碗盤清潔",
      "打桌送餐",
      "接駁駕駛",
      "交通指揮",
      "場地佈置",
    ],
  },
  {
    topic: "迎賓接待",
    options: ["貴賓服務", "諮詢服務", "導覽解說", "旅遊參訪"],
  },
  {
    topic: "佛堂法務",
    options: ["法會護壇", "佛堂執禮", "茶水毛巾"],
  },
  {
    topic: "文宣美編",
    options: [
      "攝影錄像",
      "影像剪輯",
      "採訪撰稿",
      "刊物編輯",
      "美術編輯",
      "網頁設計",
    ],
  },
];

export const CLASS_ACTIVITY_TITLES = [
  "壇主清口當愿班",
  "中級部",
  "培訓班",
  "大內新民班",
  "天元新民班",
  "天誠新民班",
  "天宏新民班",
  "何氏新民班",
  "大內青年班",
  "天元讀經班",
  "燕巢讀經班",
];

export const CLASS_ACTIVITY_LOCATION_MAP = new Map<
  string,
  { address: string; gps: [number, number] }
>([
  [
    "天一聖道院",
    {
      address: "高雄市田寮區南安路175之25號",
      gps: [22.863541598094525, 120.36627531051637],
    },
  ],
  [
    "大內天智佛堂",
    { address: "台南市大內區頭社村84號之12", gps: [23.148347, 120.382657] },
  ],
  [
    "歸仁天元佛堂",
    { address: "台南市歸仁區大德一街56號", gps: [22.97244, 120.274495] },
  ],
  [
    "路竹天誠佛堂",
    {
      address: "高雄市路竹區大同區513巷136號",
      gps: [22.853570218630185, 120.27035478246502],
    },
  ],
  [
    "燕巢天宏佛堂",
    {
      address: "高雄市燕巢區尖山里後荷巷28號",
      gps: [22.823402, 120.369879],
    },
  ],
  [
    "燕巢何氏佛堂",
    {
      address: "高雄市燕巢區尖山里後荷巷28號",
      gps: [22.823402, 120.369879],
    },
  ],
]);

export const CLASS_ACTIVITY_LOCATIONS = Array.from(
  CLASS_ACTIVITY_LOCATION_MAP.keys(),
);

export const toDuration = (startDateTime: Date, endDateTime: Date) =>
  (endDateTime.getTime() - startDateTime.getTime()) / 60 / 60 / 1000;

export const getEndTime = (startDateTime: Date, duration: number) =>
  new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

export const getCurrentDateTime = (offset = 0) => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset();
  const offsetMs = (-tzOffset + offset) * 60 * 1000;
  const localTime = new Date(now.getTime() + offsetMs);
  return localTime.toISOString().slice(0, 16);
};

export const titleIsOther = (title: string) => {
  for (const topic of VOLUNTEER_ACTIVITY_TOPICS) {
    if (topic.options.includes(title)) {
      return false;
    }
  }
  for (const _title of CLASS_ACTIVITY_TITLES) {
    if (_title === title) {
      return false;
    }
  }
  return true;
};

export const locationIsOther = (location: string) => {
  for (const _location of CLASS_ACTIVITY_LOCATIONS) {
    if (_location === location) {
      return false;
    }
  }
  return true;
};

export function formatMilliseconds(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  let formattedTime = "";
  if (hours > 0) {
    formattedTime += hours + " 小時";
  }

  if (remainingMinutes > 0) {
    if (formattedTime.length > 0) {
      formattedTime += " ";
    }
    formattedTime += remainingMinutes + " 分鐘";
  }

  if (formattedTime === "" || hours == 0) {
    formattedTime = formattedTime + " " + remainingSeconds + " 秒";
  }

  return formattedTime;
}

export const TIANI_GPS_CENTERS: [number, number][] = [
  ...Array.from(CLASS_ACTIVITY_LOCATION_MAP.values()).map((v) => v.gps),
  [22.975141, 120.298921], // 歸仁
  [25.005224, 121.557164], // 文山
];

export const TIANI_GPS_RADIUS_KM = 1.0;

export function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const lat1Rad = degToRad(lat1);
  const lon1Rad = degToRad(lon1);
  const lat2Rad = degToRad(lat2);
  const lon2Rad = degToRad(lon2);

  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in kilometers

  return distance;
}

function degToRad(deg: number) {
  return deg * (Math.PI / 180);
}

export const getDateTimeString = (date: Date) => {
  const tzOffset = date.getTimezoneOffset();
  const offsetMs = -tzOffset * 60 * 1000;
  const localTime = new Date(date.getTime() + offsetMs);
  return localTime.toISOString().slice(0, 16);
};

export const trimString = (u: unknown) =>
  typeof u === "string" ? u.trim() : u;

export const activityIsStarted = (startDateTime: Date, now?: Date) => {
  return addHours(startDateTime, -1) <= (now ?? new Date());
};

export const activityIsEnded = (endDateTime: Date, now?: Date) => {
  return addHours(endDateTime, 1) <= (now ?? new Date());
};

export const activityIsOnGoing = (
  startDateTime: Date,
  endDateTime: Date,
  now?: Date,
) => {
  return (
    activityIsStarted(startDateTime, now) && !activityIsEnded(endDateTime, now)
  );
};
