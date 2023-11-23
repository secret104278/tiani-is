import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { includes, isEmpty, sortBy } from "lodash";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function AdminCasualUserList() {
  const router = useRouter();
  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
  } = api.user.getUsers.useQuery({});

  const { register, watch } = useForm<{ username: string }>({
    mode: "all",
  });

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
