import { isEmpty } from "lodash";
import { useForm } from "react-hook-form";
import { AlertWarning } from "~/components/utils/Alert";
import { WorkingFilters } from "~/components/volunteer/WorkingFilters";
import { WorkingUserList } from "~/components/volunteer/WorkingUserList";
import { useWorkingDateRange } from "~/hooks/useWorkingDateRange";
import { api } from "~/utils/api";

export default function AdminCasualUserList() {
  const {
    dateRangeOption,
    debouncedStart,
    debouncedEnd,
    setDateRangeType,
    setCustomDateRange,
  } = useWorkingDateRange({ type: "today" });

  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
  } = api.volunteerActivity.getUsersWithWorkingStatsByCheckIn.useQuery({
    start: debouncedStart ?? undefined,
    end: debouncedEnd ?? undefined,
  });

  const { register, watch } = useForm<{
    username: string;
  }>({
    mode: "all",
  });

  if (!isEmpty(usersError))
    return <AlertWarning>{usersError.message}</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>工作管理</h1>
      </article>

      <WorkingFilters
        register={register}
        dateRangeOption={dateRangeOption}
        onDateRangeTypeChange={setDateRangeType}
        onDateSelect={setCustomDateRange}
      />

      <div className="divider" />

      <div className="overflow-x-auto">
        <WorkingUserList
          users={users}
          isLoading={usersIsLoading}
          usernameFilter={watch("username")}
        />
      </div>
    </div>
  );
}
