"use client";

import {
  eachDayOfInterval,
  endOfYear,
  format,
  getDay,
  getMonth,
  getWeek,
  setDay,
  startOfWeek,
  startOfYear,
} from "date-fns";
import React from "react";
import { cn } from "~/lib/utils";
import { DEFAULT_LOCALE, formatDate } from "~/utils/ui";

// Types
interface ActivityData {
  date: Date;
  workingHours: number;
}

type WeekData = Record<number, number[]>;
type MonthData = Record<number, number[]>;

// Utility functions
const createHoursMap = (chartData: ActivityData[]) =>
  new Map(chartData.map((d) => [format(d.date, "yyyy-MM-dd"), d.workingHours]));

const createCompleteData = (
  startDate: Date,
  endDate: Date,
  hoursMap: Map<string, number>,
) => {
  const allDates = eachDayOfInterval({ start: startDate, end: endDate });
  return allDates.map((date) => ({
    date,
    workingHours: hoursMap.get(format(date, "yyyy-MM-dd")) ?? 0,
  }));
};

const groupDataByWeek = (completeData: ActivityData[]): WeekData => {
  return completeData.reduce((acc, { date, workingHours }) => {
    const weekNum = getWeek(date);
    if (!acc[weekNum]) {
      acc[weekNum] = Array.from<number>({ length: 7 }).fill(0);
    }
    acc[weekNum][getDay(date)] = workingHours;
    return acc;
  }, {} as WeekData);
};

const groupWeeksByMonth = (
  weeks: number[],
  completeData: ActivityData[],
): MonthData => {
  return weeks.reduce((acc, week) => {
    const date = startOfWeek(
      completeData.find((d) => getWeek(d.date) === week)?.date ?? new Date(),
    );
    const month = getMonth(date);
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(week);
    return acc;
  }, {} as MonthData);
};

// Internal Components
const WeekdayLabels = React.memo(function WeekdayLabels() {
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const date = setDay(new Date(), i);
    return format(date, "EEE", { locale: DEFAULT_LOCALE });
  });

  return (
    <div
      className="grid content-start pr-2"
      style={{
        gap: "var(--cell-gap)",
        gridTemplateRows: "var(--header-height) repeat(7, var(--grid-size))",
        gridTemplateColumns: "24px",
      }}
    >
      <div />
      {weekdays.map((day) => (
        <div key={day} className="text-base-content/70 text-xs">
          {day}
        </div>
      ))}
    </div>
  );
});

const ActivityCell = React.memo(function ActivityCell({
  hours,
  date,
}: {
  hours: number;
  date?: Date;
}) {
  const intensity = Math.min(hours / 4, 1);

  return (
    <div
      tabIndex={0}
      role="gridcell"
      data-date={date ? format(date, "yyyy-MM-dd") : undefined}
      className={cn(
        "rounded-[3px] border-[1px] border-neutral-foreground/10",
        hours === 0 ? "bg-base-200" : "bg-neutral",
        hours > 0 && "bg-opacity-[var(--intensity)]",
      )}
      style={
        {
          "--intensity": intensity,
          width: "var(--cell-size)",
          height: "var(--cell-size)",
        } as React.CSSProperties
      }
      title={
        date
          ? `${hours.toFixed(1)} 小時 - ${formatDate(date)}`
          : `${hours.toFixed(1)} 小時`
      }
    />
  );
});

// Main Component
export function ActivityChart({
  chartData,
  year,
}: { chartData: ActivityData[]; year: number | string }) {
  const endDate = endOfYear(new Date(Number(year), 11, 31));
  const startDate = startOfYear(new Date(Number(year), 0, 1));

  const hoursMap = createHoursMap(chartData);
  const completeData = createCompleteData(startDate, endDate, hoursMap);
  const dataByWeek = groupDataByWeek(completeData);
  const weeks = Object.keys(dataByWeek)
    .map(Number)
    .sort((a, b) => a - b);
  const weeksByMonth = groupWeeksByMonth(weeks, completeData);

  return (
    <div
      className="overflow-x-auto overflow-y-hidden"
      style={
        {
          "--cell-size": "13px",
          "--cell-gap": "1.8px",
          "--grid-size": "calc(var(--cell-size) + var(--cell-gap))",
          "--header-height": "14px",
        } as React.CSSProperties
      }
    >
      <div className="grid grid-cols-[auto_1fr]">
        <WeekdayLabels />

        <div
          className="grid"
          style={{
            gap: "var(--cell-gap)",
            gridTemplateRows:
              "var(--header-height) repeat(7, var(--grid-size))",
            gridTemplateColumns: `repeat(${weeks.length}, var(--grid-size))`,
          }}
        >
          {Object.entries(weeksByMonth).map(([month, monthWeeks]) => {
            const date = new Date();
            date.setMonth(Number(month));
            return (
              <div
                key={month}
                className="relative"
                style={{
                  gridColumn: `span ${monthWeeks.length}`,
                  height: "var(--header-height)",
                }}
              >
                <span className="sr-only">
                  {format(date, "MMMM", { locale: DEFAULT_LOCALE })}
                </span>
                <span
                  className="absolute top-0 left-0 font-normal text-base-content text-xs"
                  aria-hidden="true"
                >
                  {format(date, "MMM", { locale: DEFAULT_LOCALE })}
                </span>
              </div>
            );
          })}

          {Array.from({ length: 7 }, (_, dayIndex) =>
            weeks.map((week) => {
              const weekData = dataByWeek[week] ?? Array<number>(7).fill(0);
              const hours = weekData[dayIndex] ?? 0;
              const date = completeData.find(
                (d) => getWeek(d.date) === week && getDay(d.date) === dayIndex,
              )?.date;

              return (
                <ActivityCell
                  key={`${week}-${dayIndex}`}
                  hours={hours}
                  date={date}
                />
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
