import { Role } from "@prisma/client";
import { isEmpty, sortBy } from "lodash";
import { useSession } from "next-auth/react";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function AdminUsersPage() {
  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
    refetch: usersRefetch,
  } = api.user.getUsers.useQuery({});

  const { mutate: setIsTianiAdmin } = api.user.setIsTianiAdmin.useMutation({
    onSettled: () => usersRefetch(),
  });
  const { mutate: setIsVolunteerAdmin } =
    api.user.setIsVolunteerAdmin.useMutation({
      onSettled: () => usersRefetch(),
    });
  const { mutate: setIsYideclassAdmin } =
    api.user.setIsYideclassAdmin.useMutation({
      onSettled: () => usersRefetch(),
    });

  const { data: sessionData } = useSession();

  if (usersIsLoading) return <div className="loading" />;
  if (!isEmpty(usersError))
    return <AlertWarning>{usersError.message}</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>帳號管理</h1>
      </article>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>
                最高
                <br />
                管理者
              </th>
              <th>
                天一志工隊
                <br />
                管理者
              </th>
              <th>
                義德班務網
                <br />
                管理者
              </th>
            </tr>
          </thead>
          <tbody>
            {sortBy(users, "id").map((user) => (
              <tr key={user.id} className="hover">
                <td>{user.name}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.roles.includes(Role.TIANI_ADMIN)}
                    className="checkbox"
                    disabled={user.id === sessionData?.user.id}
                    onClick={() =>
                      setIsTianiAdmin({
                        userId: user.id,
                        isAdmin: !user.roles.includes(Role.TIANI_ADMIN),
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    disabled={user.roles.includes(Role.TIANI_ADMIN)}
                    checked={user.roles.includes(Role.VOLUNTEER_ADMIN)}
                    className="checkbox"
                    onClick={() =>
                      setIsVolunteerAdmin({
                        userId: user.id,
                        isAdmin: !user.roles.includes(Role.VOLUNTEER_ADMIN),
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    disabled={user.roles.includes(Role.TIANI_ADMIN)}
                    checked={user.roles.includes(Role.YIDECLASS_ADMIN)}
                    className="checkbox"
                    onClick={() =>
                      setIsYideclassAdmin({
                        userId: user.id,
                        isAdmin: !user.roles.includes(Role.YIDECLASS_ADMIN),
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
