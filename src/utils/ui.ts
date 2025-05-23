import { TZDate } from "@date-fns/tz";
import type { VolunteerActivityStatus } from "@prisma/client";
import {
  addHours,
  differenceInMilliseconds,
  format,
  formatDuration,
  intervalToDuration,
} from "date-fns";
import { millisecondsInHour } from "date-fns/constants";
import { zhTW } from "date-fns/locale";
import _ from "lodash";
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
  "義德長青班",
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

export const YIDE_WORK_ACTIVITY_TITLES = ["獻供禮拜", "辦道儀禮"];

export const IS_LINE_NOTIFY_ENABLED = false;

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
  if (
    VOLUNTEER_ACTIVITY_TOPICS.flatMap((topic) => topic.options).includes(title)
  ) {
    return false;
  }
  if (CLASS_ACTIVITY_TITLES.includes(title)) {
    return false;
  }
  if (YIDE_WORK_ACTIVITY_TITLES.includes(title)) {
    return false;
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
    formattedTime += `${hours} 小時`;
  }

  if (remainingMinutes > 0) {
    if (formattedTime.length > 0) {
      formattedTime += " ";
    }
    formattedTime += `${remainingMinutes} 分鐘`;
  }

  if (formattedTime === "" || hours === 0) {
    formattedTime = `${formattedTime} ${remainingSeconds} 秒`;
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

export const isOutOfRange = (latitude: number, longitude: number) =>
  !TIANI_GPS_CENTERS.some(
    (center) =>
      getDistance(latitude, longitude, center[0], center[1]) <=
      TIANI_GPS_RADIUS_KM,
  );

function degToRad(deg: number) {
  return deg * (Math.PI / 180);
}

export const getDateTimeString = (date: Date) => {
  const tzOffset = date.getTimezoneOffset();
  const offsetMs = -tzOffset * 60 * 1000;
  const localTime = new Date(date.getTime() + offsetMs);
  return localTime.toISOString().slice(0, 16);
};

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

export const DEFAULT_LOCALE = zhTW;
export const DEFAULT_TIMEZONE = "Asia/Taipei";

export const formatDateTitle = (date: Date) =>
  format(
    // since the server my run in different location,
    // and the timestamp is stored in DB is in UTC,
    // so convert it to Asia/Taipei when server side rendering
    new TZDate(date, DEFAULT_TIMEZONE),
    "LLLdo(eeeee) hh:mm",
    {
      locale: DEFAULT_LOCALE,
    },
  );

export const formatDate = (date: Date) =>
  format(date, "yyyy/MM/dd (eeeee)", {
    locale: DEFAULT_LOCALE,
  });

export const formatDateTime = (date: Date) =>
  format(date, "yyyy/MM/dd (eeeee) aaaa hh:mm", {
    locale: DEFAULT_LOCALE,
  });

export const toDuration = (startDateTime: Date, endDateTime: Date) =>
  formatDuration(
    intervalToDuration({
      start: startDateTime,
      end: endDateTime,
    }),
    { locale: DEFAULT_LOCALE },
  );

export const getDurationHour = (startDateTime: Date, endDateTime: Date) =>
  (endDateTime.getTime() - startDateTime.getTime()) / 60 / 60 / 1000;

export enum Site {
  Volunteer = "volunteer",
  Yideclass = "yideclass",
  Etogether = "etogether",
  YideWork = "yidework",
  TianiShop = "tianishop",
}

export const urlBaseToSite = (urlBase?: string): Site => {
  if (urlBase === "volunteer") return Site.Volunteer;
  if (urlBase === "yideclass") return Site.Yideclass;
  if (urlBase === "etogether") return Site.Etogether;
  if (urlBase === "yidework") return Site.YideWork;
  if (urlBase === "tianishop") return Site.TianiShop;
  return Site.Volunteer;
};

export const userComparator = (
  a: { name: string | null },
  b: { name: string | null },
) => {
  return !!a.name && !!b.name ? a.name.localeCompare(b.name, "zh-Hant-TW") : 0;
};

export const siteToTitle = (site?: Site) => {
  switch (site) {
    case Site.Volunteer:
      return "天一志工隊";
    case Site.Yideclass:
      return "義德班務網";
    case Site.Etogether:
      return "活動e起來";
    case Site.YideWork:
      return "義德道務網";
    case Site.TianiShop:
      return "天一友購站";
    default:
      return "天一聖道院資訊系統";
  }
};

export const differenceInHoursNoRound = (dateLeft: Date, dateRight: Date) =>
  differenceInMilliseconds(dateLeft, dateRight) / millisecondsInHour;

export const truncateTitle = (title: string) => {
  return _.truncate(title, { length: 12 });
};
