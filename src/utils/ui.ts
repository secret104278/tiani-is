import type { VolunteerActivityStatus } from "@prisma/client";
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
