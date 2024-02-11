import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  endOfMonth,
  endOfToday,
  endOfWeek,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { includes, isEmpty, sortBy } from "lodash";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/utils/api";

type DateRange = "all" | "today" | "thisWeek" | "thisMonth";

const getStartAndEnd = (dateRange: DateRange) => {
  const today = new Date();
  switch (dateRange) {
    case "all":
      return [undefined, undefined];
    case "today":
      return [startOfToday(), endOfToday()];
    case "thisWeek":
      return [
        startOfWeek(today, { weekStartsOn: 1 }),
        endOfWeek(today, { weekStartsOn: 1 }),
      ];
    case "thisMonth":
      return [startOfMonth(today), endOfMonth(today)];
    default:
      return [undefined, undefined];
  }
};

export default function AdminCasualUserList() {
  let dateRange = useSearchParams().get("dateRange") as DateRange;
  if (!["all", "today", "thisWeek", "thisMonth"].includes(dateRange))
    dateRange = "all";

  const [defaultStart, defaultEnd] = getStartAndEnd(dateRange);

  const [start, setStart] = useState<Date | undefined>(defaultStart);
  const [end, setEnd] = useState<Date | undefined>(defaultEnd);

  const router = useRouter();
  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
  } = api.volunteerActivity.getUsersByCheckIn.useQuery({
    start: start,
    end: end,
  });

  useEffect(() => {
    const [newStart, newEnd] = getStartAndEnd(dateRange);
    setStart(newStart);
    setEnd(newEnd);
  }, [dateRange]);

  const { register, watch } = useForm<{
    username: string;
  }>({
    mode: "all",
  });

  if (usersIsLoading) return <div className="loading" />;
  if (!isEmpty(usersError))
    return <AlertWarning>{usersError.message}</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>工作管理</h1>
      </article>
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
        defaultValue={dateRange}
        onChange={(e) => {
          void router.replace(`?dateRange=${e.target.value}`);
        }}
      >
        <option value="all">全部日期</option>
        <option value="today">本日</option>
        <option value="thisWeek">本週</option>
        <option value="thisMonth">本月</option>
      </select>
      <div className="divider" />
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>姓名</th>
            </tr>
          </thead>
          <tbody>
            {sortBy(users, "id")
              .filter(
                (user) =>
                  isEmpty(watch("username")) ||
                  includes(
                    user.name?.toLowerCase(),
                    watch("username")?.toLowerCase(),
                  ),
              )
              .map((user) => (
                <tr
                  key={user.id}
                  className="hover hover:cursor-pointer"
                  onClick={() =>
                    void router.push(`/volunteer/admin/working/${user.id}`)
                  }
                >
                  <td>{user.name}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
