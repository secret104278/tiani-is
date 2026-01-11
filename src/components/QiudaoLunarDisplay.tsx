import lunisolar from "lunisolar";

// 時辰列表（地支）
export const HOURS = [
  { value: "子", label: "子時 (23:00-01:00)", range: [23, 1] },
  { value: "丑", label: "丑時 (01:00-03:00)", range: [1, 3] },
  { value: "寅", label: "寅時 (03:00-05:00)", range: [3, 5] },
  { value: "卯", label: "卯時 (05:00-07:00)", range: [5, 7] },
  { value: "辰", label: "辰時 (07:00-09:00)", range: [7, 9] },
  { value: "巳", label: "巳時 (09:00-11:00)", range: [9, 11] },
  { value: "午", label: "午時 (11:00-13:00)", range: [11, 13] },
  { value: "未", label: "未時 (13:00-15:00)", range: [13, 15] },
  { value: "申", label: "申時 (15:00-17:00)", range: [15, 17] },
  { value: "酉", label: "酉時 (17:00-19:00)", range: [17, 19] },
  { value: "戌", label: "戌時 (19:00-21:00)", range: [19, 21] },
  { value: "亥", label: "亥時 (21:00-23:00)", range: [21, 23] },
];

export function getHourLabel(hourValue?: string | null) {
  if (!hourValue) return "";
  return HOURS.find((h) => h.value === hourValue)?.label || hourValue;
}

export function getTimeToHourValue(date: Date) {
  const hour = date.getHours();
  if (hour >= 23 || hour < 1) return "子";
  if (hour >= 1 && hour < 3) return "丑";
  if (hour >= 3 && hour < 5) return "寅";
  if (hour >= 5 && hour < 7) return "卯";
  if (hour >= 7 && hour < 9) return "辰";
  if (hour >= 9 && hour < 11) return "巳";
  if (hour >= 11 && hour < 13) return "午";
  if (hour >= 13 && hour < 15) return "未";
  if (hour >= 15 && hour < 17) return "申";
  if (hour >= 17 && hour < 19) return "酉";
  if (hour >= 19 && hour < 21) return "戌";
  if (hour >= 21 && hour < 23) return "亥";
  return "";
}

interface QiudaoLunarDisplayProps {
  solarDate?: string;
  hour?: string;
  onHourChange?: (hour: string) => void;
  readonly?: boolean;
}

export default function QiudaoLunarDisplay({
  solarDate,
  hour,
  onHourChange,
  readonly = false,
}: QiudaoLunarDisplayProps) {
  let lunarString: string | null = null;

  if (solarDate) {
    try {
      const lunar = lunisolar(solarDate);

      lunarString = lunar.format("cY年 lMlD");
    } catch (e) {
      // Invalid date
    }
  }

  return (
    <div className="space-y-4">
      {/* 時辰選擇器 */}
      {!readonly && (
        <div>
          <label className="label" htmlFor="qiudao-hour-select">
            <span className="label-text">時辰</span>
          </label>
          <select
            id="qiudao-hour-select"
            className="select select-bordered w-full"
            value={hour || ""}
            onChange={(e) => onHourChange?.(e.target.value)}
          >
            <option value="">請選擇時辰</option>
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 農曆顯示 */}
      {lunarString && (
        <div>
          <label className="label">
            <span className="label-text">求道日期（農曆）</span>
          </label>
          <div className="input input-bordered flex w-full items-center bg-base-200">
            {lunarString}
            {hour && ` ${hour}時`}
          </div>
        </div>
      )}
    </div>
  );
}
