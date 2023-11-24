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
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

type DateRange = "all" | "today" | "thisWeek" | "thisMonth";

export default function AdminCasualUserList() {
  const [start, setStart] = useState<Date | undefined>(undefined);
  const [end, setEnd] = useState<Date | undefined>(undefined);

  const router = useRouter();
  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
  } = api.volunteerActivity.getUsersByCasual.useQuery({
    start: start,
    end: end,
  });

  const { register, watch } = useForm<{
    username: string;
    dateRange: DateRange;
  }>({
    defaultValues: {
      dateRange: "all",
    },
    mode: "all",
  });

  const dateRange = watch("dateRange");
  useEffect(() => {
    const today = new Date();
    switch (dateRange) {
      case "all":
        setStart(undefined);
        setEnd(undefined);
        break;
      case "today":
        setStart(startOfToday());
        setEnd(endOfToday());
        break;
      case "thisWeek":
        setStart(startOfWeek(today, { weekStartsOn: 1 }));
        setEnd(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case "thisMonth":
        setStart(startOfMonth(today));
        setEnd(endOfMonth(today));
        break;
    }
  }, [dateRange]);

  if (usersIsLoading) return <div className="loading" />;
  if (!isEmpty(usersError))
    return <AlertWarning>{usersError.message}</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>日常工作管理</h1>
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
        {...register("dateRange")}
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
                    void router.push(`/volunteer/admin/casual/${user.id}`)
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
