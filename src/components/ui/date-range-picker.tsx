"use client";

import { endOfDay, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { formatDate } from "~/utils/ui";

export function DatePickerWithRange({
  className,
  date,
  onSelect,
}: {
  className?: string;
  date?: DateRange;
  onSelect?: (date: DateRange | undefined) => void;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            size="lg"
            className={cn("font-normal", !date && "text-muted-foreground")}
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {formatDate(date.from)} - {formatDate(date.to)}
                </>
              ) : (
                formatDate(date.from)
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            autoFocus
            mode="range"
            required
            defaultMonth={date?.from}
            selected={date}
            onSelect={(dateRange) => {
              onSelect?.({
                from: dateRange.from && startOfDay(dateRange.from),
                to: dateRange.to && endOfDay(dateRange.to),
              });
            }}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
