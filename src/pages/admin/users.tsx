import { PlusIcon } from "@heroicons/react/20/solid";
import { Role } from "@prisma/client";
import { isEmpty, sortBy } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertWarning } from "~/components/Alert";
import Dialog from "~/components/Dialog";
import ReactiveButton from "~/components/ReactiveButton";
import { api } from "~/utils/api";

function CreateUserDialog() {
  const router = useRouter();

  const {
    mutate: createUser,
    isLoading: createUserIsLoading,
    error: createUserError,
  } = api.user.createUser.useMutation({ onSuccess: () => router.reload() });

  const { register, handleSubmit } = useForm<{ username: string }>();

  return (
    <>
      <h3 className="text-lg font-bold">新增帳號</h3>
      <AlertWarning>
        新增帳號僅限用於道親沒有 Line 帳號也沒有使用 3C
        產品，且短期內也不會嘗試使用。
        <br />
        此帳號建立後將主要用於管理員或壇務協助手動打卡
      </AlertWarning>
      <form
        className="form-control space-y-4"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={handleSubmit((data) =>
          createUser({ username: data.username }),
        )}
      >
        <div>
          <label className="label">
            <span className="label-text">姓名</span>
          </label>
          <input
            type="text"
            className="tiani-input"
            required
            {...register("username", { required: true })}
          />
        </div>
        <div className="flex flex-row justify-end space-x-4">
          <ReactiveButton
            type="submit"
            className="btn btn-primary"
            loading={createUserIsLoading}
            error={createUserError?.message}
          >
            建立
          </ReactiveButton>
        </div>
      </form>
    </>
  );
}

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

  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);

  const { data: sessionData } = useSession();

  if (usersIsLoading) return <div className="loading" />;
  if (!isEmpty(usersError))
    return <AlertWarning>{usersError.message}</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>帳號管理</h1>
      </article>
      <div className="flex justify-end">
        <ReactiveButton
          className="btn"
          onClick={() => setCreateUserDialogOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          新增帳號
        </ReactiveButton>
        <Dialog
          open={createUserDialogOpen}
          onClose={() => setCreateUserDialogOpen(false)}
        >
          <CreateUserDialog />
        </Dialog>
      </div>
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
