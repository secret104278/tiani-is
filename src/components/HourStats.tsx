import { ClockIcon } from "@heroicons/react/20/solid";

export function HourStats({
  title,
  totalWorkingHours,
}: {
  title: string;
  totalWorkingHours?: number;
}) {
  return (
    <div className="stats stats-vertical shadow-lg sm:stats-horizontal">
      <div className="stat">
        <div className="stat-figure text-primary">
          <ClockIcon className="h-8 w-8" />
        </div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{totalWorkingHours?.toFixed(2)}</div>
      </div>
    </div>
  );
}
