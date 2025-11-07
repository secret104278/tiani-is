import lunisolar from "lunisolar";

// 時辰列表（地支）
export const HOURS = [
  { value: "子", label: "子時 (23:00-01:00)" },
  { value: "丑", label: "丑時 (01:00-03:00)" },
  { value: "寅", label: "寅時 (03:00-05:00)" },
  { value: "卯", label: "卯時 (05:00-07:00)" },
  { value: "辰", label: "辰時 (07:00-09:00)" },
  { value: "巳", label: "巳時 (09:00-11:00)" },
  { value: "午", label: "午時 (11:00-13:00)" },
  { value: "未", label: "未時 (13:00-15:00)" },
  { value: "申", label: "申時 (15:00-17:00)" },
  { value: "酉", label: "酉時 (17:00-19:00)" },
  { value: "戌", label: "戌時 (19:00-21:00)" },
  { value: "亥", label: "亥時 (21:00-23:00)" },
];

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
  let lunarInfo: {
    ganzhiYear: string;
    month: string;
    day: string;
  } | null = null;

  if (solarDate) {
    try {
      const lunar = lunisolar(solarDate);

      // 獲取天干地支年份
      const ganzhiYear = lunar.format("cY");

      // 獲取農曆月份（中文）
      const monthStr = lunar.format("lMMMM");

      // 獲取農曆日期（中文）
      const dayStr = lunar.format("lD");

      lunarInfo = {
        ganzhiYear,
        month: monthStr,
        day: dayStr,
      };
    } catch (e) {
      // Invalid date
    }
  }

  return (
    <div className="space-y-4">
      {/* 時辰選擇器 */}
      {!readonly && (
        <div>
          <label className="label">
            <span className="label-text">時辰</span>
          </label>
          <select
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
      {lunarInfo && (
        <div>
          <label className="label">
            <span className="label-text">求道日期（農曆）</span>
          </label>
          <div className="input input-bordered w-full bg-base-200 flex items-center">
            {lunarInfo.ganzhiYear} {lunarInfo.month} {lunarInfo.day}
            {hour && ` ${hour}時`}
          </div>
        </div>
      )}
    </div>
  );
}
