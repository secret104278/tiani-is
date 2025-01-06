import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { type DateRange } from "react-day-picker";
import { type UseFormRegister } from "react-hook-form";
import { DatePickerWithRange } from "~/components/ui/date-range-picker";
import { type DateRangeOption } from "~/hooks/useWorkingDateRange";

interface WorkingFiltersProps {
  register: UseFormRegister<{ username: string }>;
  dateRangeOption: DateRangeOption;
  onDateRangeTypeChange: (value: DateRangeOption["type"]) => void;
  start?: Date;
  end?: Date;
  onDateSelect: (value: DateRange | undefined) => void;
}

export function WorkingFilters({
  register,
  dateRangeOption,
  onDateRangeTypeChange,
  onDateSelect,
}: WorkingFiltersProps) {
  return (
    <>
      <div className="divider">
        <MagnifyingGlassIcon className="h-8 w-8" />
        篩選
      </div>
      <input
        type="text"
        placeholder="姓名"
        className="tiani-input"
        {...register("username")}
      />
      <select
        className="select select-bordered w-full"
        value={dateRangeOption.type}
        onChange={(e) => {
          const value = e.target.value as DateRangeOption["type"];
          onDateRangeTypeChange(value);
        }}
      >
        <option value="all">全部日期</option>
        <option value="custom">自訂區間</option>
        <option value="today">本日</option>
        <option value="thisWeek">本週</option>
        <option value="thisMonth">本月</option>
        <option value="last7Days">過去7天</option>
        <option value="last30Days">過去30天</option>
      </select>
      {dateRangeOption.type === "custom" && (
        <div>
          <DatePickerWithRange
            date={{ from: dateRangeOption.start, to: dateRangeOption.end }}
            onSelect={onDateSelect}
          />
        </div>
      )}
    </>
  );
}
