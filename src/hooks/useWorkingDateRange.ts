import {
  endOfDay,
  endOfMonth,
  endOfToday,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subDays,
} from "date-fns";
import { parseAsJson, useQueryState } from "nuqs";
import { useCallback, useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useDebounce } from "react-use";
import { z } from "zod";

const dateRangeOptionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum([
      "all",
      "today",
      "thisWeek",
      "thisMonth",
      "last7Days",
      "last30Days",
    ]),
  }),
  z.object({
    type: z.literal("custom"),
    start: z.string().transform((str) => new Date(str)),
    end: z.string().transform((str) => new Date(str)),
  }),
]);

export type DateRangeOption = z.infer<typeof dateRangeOptionSchema>;

const getStartAndEnd = (
  dateRange: DateRangeOption,
): [Date | null, Date | null] => {
  const today = new Date();
  if (dateRange.type === "all") {
    return [null, null];
  }
  if (dateRange.type === "today") {
    return [startOfToday(), endOfToday()];
  }
  if (dateRange.type === "thisWeek") {
    return [
      startOfWeek(today, { weekStartsOn: 1 }),
      endOfWeek(today, { weekStartsOn: 1 }),
    ];
  }
  if (dateRange.type === "thisMonth") {
    return [startOfMonth(today), endOfMonth(today)];
  }
  if (dateRange.type === "last7Days") {
    return [startOfDay(subDays(today, 6)), endOfToday()];
  }
  if (dateRange.type === "last30Days") {
    return [startOfDay(subDays(today, 29)), endOfToday()];
  }
  if (dateRange.type === "custom") {
    return [startOfDay(dateRange.start), endOfDay(dateRange.end)];
  }
  throw new Error("Invalid date range");
};

export function useWorkingDateRange(defaultDateRange: DateRangeOption) {
  const [dateRangeOption, setDateRangeOption] = useQueryState<DateRangeOption>(
    "dateRangeOption",
    parseAsJson((value) => dateRangeOptionSchema.parse(value))
      .withDefault(defaultDateRange)
      .withOptions({
        clearOnDefault: true,
        shallow: true,
      }),
  );

  /** --- for state to debounced state --- */
  const [defaultStart, defaultEnd] = getStartAndEnd(dateRangeOption);
  const [debouncedStart, setDebouncedStart] = useState<Date | null>(
    defaultStart,
  );
  const [debouncedEnd, setDebouncedEnd] = useState<Date | null>(defaultEnd);

  useDebounce(
    () => {
      if (dateRangeOption.type === "custom") {
        setDebouncedStart(dateRangeOption.start);
        setDebouncedEnd(dateRangeOption.end);
      }
    },
    1000,
    [dateRangeOption],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    if (dateRangeOption.type !== "custom") {
      const [newStart, newEnd] = getStartAndEnd(dateRangeOption);
      setDebouncedStart(newStart);
      setDebouncedEnd(newEnd);
    }
  }, [JSON.stringify(dateRangeOption)]);

  /** --- for update date range value --- */

  const setDateRangeType = useCallback(
    (type: DateRangeOption["type"]) => {
      if (type === "custom") {
        void setDateRangeOption({
          type: "custom",
          start: subDays(startOfToday(), 7),
          end: endOfToday(),
        });
      } else {
        void setDateRangeOption({ type });
      }
    },
    [setDateRangeOption],
  );

  const setCustomDateRange = useCallback(
    (value: DateRange | undefined) => {
      if (value?.from && value.to) {
        void setDateRangeOption({
          type: "custom",
          start: value.from,
          end: value.to,
        });
      }
    },
    [setDateRangeOption],
  );

  return {
    dateRangeOption,
    debouncedStart,
    debouncedEnd,

    setDateRangeType,
    setCustomDateRange,
  };
}
