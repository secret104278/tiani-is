import { includes, isEmpty, sortBy } from "lodash";
import { useRouter } from "next/router";
import type { RouterOutputs } from "~/utils/api";

type User =
  RouterOutputs["volunteerActivity"]["getUsersWithWorkingStatsByCheckIn"][number];

interface WorkingUserListProps {
  users: User[] | undefined;
  isLoading: boolean;
  usernameFilter: string;
}

export function WorkingUserList({
  users,
  isLoading,
  usernameFilter,
}: WorkingUserListProps) {
  const router = useRouter();

  if (isLoading) {
    return <div className="loading" />;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>姓名</th>
          <th>區間內服務時數</th>
          <th>總服務時數</th>
        </tr>
      </thead>
      <tbody>
        {sortBy(users, (user) => user.totalWorkingHours)
          .reverse()
          .filter(
            (user) =>
              isEmpty(usernameFilter) ||
              includes(user.name?.toLowerCase(), usernameFilter?.toLowerCase()),
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
              <td>{user.workingHoursInQueryRange.toFixed(2)}</td>
              <td>{user.totalWorkingHours.toFixed(2)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
