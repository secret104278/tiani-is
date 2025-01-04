"use client";

import { BarsArrowDownIcon, PlusIcon } from "@heroicons/react/20/solid";
import { Role } from "@prisma/client";
import { isEmpty, truncate } from "lodash";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import AlertWarning from "~/app/_components/basic/alert-warning";
import Dialog from "~/app/_components/basic/dialog";
import ReactiveButton from "~/app/_components/basic/reactive-button";
import { api } from "~/trpc/react";
import { userComparator } from "~/utils/ui";

function CreateUserDialogContent() {
  const router = useRouter();

  const {
    mutate: createUser,
    isPending: createUserIsLoading,
    error: createUserError,
  } = api.appUser.createUser.useMutation({ onSuccess: () => router.refresh() });

  const { register, handleSubmit } = useForm<{ username: string }>();

  return (
    <>
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

enum SortedType {
  NAME,
  IS_TIANI_ADMIN,
  IS_VOLUNTEER_ADMIN,
  IS_YIDECLASS_ADMIN,
  IS_ETOGETHER_ADMIN,
  IS_YIDEWORK_ADMIN,
}

const getComparator = (sortedType: SortedType) => {
  type User = { name: string | null; roles: Role[] };

  const rolesComparator = (role: Role) => (a: User, b: User) =>
    Number(b.roles.includes(role) || b.roles.includes(Role.TIANI_ADMIN)) -
    Number(a.roles.includes(role) || a.roles.includes(Role.TIANI_ADMIN));

  switch (sortedType) {
    case SortedType.NAME:
      return userComparator;
    case SortedType.IS_TIANI_ADMIN:
      return (a: User, b: User) => {
        const result = rolesComparator(Role.TIANI_ADMIN)(a, b);
        return result !== 0 ? result : userComparator(a, b);
      };
    case SortedType.IS_VOLUNTEER_ADMIN:
      return (a: User, b: User) => {
        const result = rolesComparator(Role.VOLUNTEER_ADMIN)(a, b);
        return result !== 0 ? result : userComparator(a, b);
      };
    case SortedType.IS_YIDECLASS_ADMIN:
      return (a: User, b: User) => {
        const result = rolesComparator(Role.YIDECLASS_ADMIN)(a, b);
        return result !== 0 ? result : userComparator(a, b);
      };
    case SortedType.IS_YIDEWORK_ADMIN:
      return (a: User, b: User) => {
        const result = rolesComparator(Role.YIDEWORK_ADMIN)(a, b);
        return result !== 0 ? result : userComparator(a, b);
      };
    case SortedType.IS_ETOGETHER_ADMIN:
      return (a: User, b: User) => {
        const result = rolesComparator(Role.ETOGETHER_ADMIN)(a, b);
        return result !== 0 ? result : userComparator(a, b);
      };
  }
};

export default function AdminUsersPage() {
  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
    refetch: usersRefetch,
  } = api.appUser.getUsers.useQuery();

  const { mutate: setIsTianiAdmin } = api.appUser.setIsTianiAdmin.useMutation({
    onSettled: () => usersRefetch(),
  });
  const { mutate: setIsVolunteerAdmin } =
    api.appUser.setIsVolunteerAdmin.useMutation({
      onSettled: () => usersRefetch(),
    });
  const { mutate: setIsYideclassAdmin } =
    api.appUser.setIsYideclassAdmin.useMutation({
      onSettled: () => usersRefetch(),
    });
  const { mutate: setIsYideworkAdmin } =
    api.appUser.setIsYideworkAdmin.useMutation({
      onSettled: () => usersRefetch(),
    });
  const { mutate: setIsEtogetherAdmin } =
    api.appUser.setIsEtogetherAdmin.useMutation({
      onSettled: () => usersRefetch(),
    });

  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);

  const [sortedType, setSortedType] = useState(SortedType.NAME);

  const { data: sessionData } = useSession();

  if (usersIsLoading) return <div className="loading" />;
  if (!isEmpty(usersError))
    return <AlertWarning>{usersError.message}</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between">
        <article className="prose">
          <h1>帳號管理</h1>
        </article>
        <div>
          <ReactiveButton
            className="btn"
            onClick={() => setCreateUserDialogOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            新增帳號
          </ReactiveButton>
          <Dialog
            title="新增帳號"
            show={createUserDialogOpen}
            closeModal={() => setCreateUserDialogOpen(false)}
          >
            <CreateUserDialogContent />
          </Dialog>
        </div>
      </div>
      <div className="h-[calc(100vh-11rem)] overflow-x-auto">
        <table className="table table-pin-rows table-sm">
          <thead>
            <tr className="z-20 bg-base-300">
              <th className="tiani-table-pin-col bg-base-300">
                <div
                  className="flex cursor-pointer"
                  onClick={() => setSortedType(SortedType.NAME)}
                >
                  姓名
                  {sortedType === SortedType.NAME && (
                    <BarsArrowDownIcon className="ml-1 w-4" />
                  )}
                </div>
              </th>
              <th>
                <div
                  className="flex cursor-pointer"
                  onClick={() => setSortedType(SortedType.IS_TIANI_ADMIN)}
                >
                  最高
                  <br />
                  管理者
                  {sortedType === SortedType.IS_TIANI_ADMIN && (
                    <BarsArrowDownIcon className="ml-1 w-4" />
                  )}
                </div>
              </th>
              <th>
                <div
                  className="flex cursor-pointer"
                  onClick={() => setSortedType(SortedType.IS_VOLUNTEER_ADMIN)}
                >
                  天一志工隊
                  <br />
                  管理者
                  {sortedType === SortedType.IS_VOLUNTEER_ADMIN && (
                    <BarsArrowDownIcon className="ml-1 w-4" />
                  )}
                </div>
              </th>
              <th>
                <div
                  className="flex cursor-pointer"
                  onClick={() => setSortedType(SortedType.IS_YIDECLASS_ADMIN)}
                >
                  義德班務網
                  <br />
                  管理者
                  {sortedType === SortedType.IS_YIDECLASS_ADMIN && (
                    <BarsArrowDownIcon className="ml-1 w-4" />
                  )}
                </div>
              </th>
              <th>
                <div
                  className="flex cursor-pointer"
                  onClick={() => setSortedType(SortedType.IS_YIDEWORK_ADMIN)}
                >
                  義德道務網
                  <br />
                  管理者
                  {sortedType === SortedType.IS_YIDEWORK_ADMIN && (
                    <BarsArrowDownIcon className="ml-1 w-4" />
                  )}
                </div>
              </th>
              <th>
                <div
                  className="flex cursor-pointer"
                  onClick={() => setSortedType(SortedType.IS_ETOGETHER_ADMIN)}
                >
                  活動e起來
                  <br />
                  管理者
                  {sortedType === SortedType.IS_ETOGETHER_ADMIN && (
                    <BarsArrowDownIcon className="ml-1 w-4" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {users?.sort(getComparator(sortedType))?.map((user) => (
              <tr key={user.id} className="hover">
                <td className="tiani-table-pin-col bg-base-200">
                  <div className="tooltip tooltip-right" data-tip={user.name}>
                    {truncate(user.name ?? undefined, { length: 6 })}
                  </div>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.roles.includes(Role.TIANI_ADMIN)}
                    className="checkbox"
                    disabled={user.id === sessionData?.user.id}
                    onChange={() =>
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
                    onChange={() =>
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
                    onChange={() =>
                      setIsYideclassAdmin({
                        userId: user.id,
                        isAdmin: !user.roles.includes(Role.YIDECLASS_ADMIN),
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    disabled={user.roles.includes(Role.TIANI_ADMIN)}
                    checked={user.roles.includes(Role.YIDEWORK_ADMIN)}
                    className="checkbox"
                    onChange={() =>
                      setIsYideworkAdmin({
                        userId: user.id,
                        isAdmin: !user.roles.includes(Role.YIDEWORK_ADMIN),
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    disabled={user.roles.includes(Role.TIANI_ADMIN)}
                    checked={user.roles.includes(Role.ETOGETHER_ADMIN)}
                    className="checkbox"
                    onChange={() =>
                      setIsEtogetherAdmin({
                        userId: user.id,
                        isAdmin: !user.roles.includes(Role.ETOGETHER_ADMIN),
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
