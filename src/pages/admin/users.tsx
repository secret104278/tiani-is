import {
  BarsArrowDownIcon,
  PlusIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { Role } from "@prisma/client";
import { isEmpty, truncate } from "lodash";
import lunisolar from "lunisolar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import QiudaoLunarDisplay from "~/components/QiudaoLunarDisplay";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";
import { userComparator } from "~/utils/ui";

function CreateUserDialogContent() {
  const router = useRouter();

  const {
    mutate: createUser,
    isPending: createUserIsPending,
    error: createUserError,
  } = api.user.createUser.useMutation({ onSuccess: () => router.reload() });

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
            loading={createUserIsPending}
            error={createUserError?.message}
          >
            建立
          </ReactiveButton>
        </div>
      </form>
    </>
  );
}

type QiudaoInfoForm = {
  qiudaoDateSolar: string;
  qiudaoTemple: string;
  qiudaoTanzhu: string;
  affiliation: string;
  dianChuanShi: string;
  yinShi: string;
  baoShi: string;
};

function UserProfileDialogContent({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [qiudaoHour, setQiudaoHour] = useState<string>("");
  const [lunarDate, setLunarDate] = useState<string>("");

  const {
    data: user,
    isLoading: userIsLoading,
    error: userError,
    refetch: userRefetch,
  } = api.user.getUser.useQuery({ userId });

  const {
    mutate: updateUserQiudaoInfo,
    isPending: updateUserQiudaoInfoIsPending,
    isSuccess: updateUserQiudaoInfoIsSuccess,
    error: updateUserQiudaoInfoError,
  } = api.user.updateUserQiudaoInfo.useMutation({
    onSuccess: () => {
      void userRefetch();
      // Close dialog after successful save
      onClose();
    },
  });

  const { register, handleSubmit, reset, watch } = useForm<QiudaoInfoForm>({
    mode: "all",
  });

  // Watch for solar date changes
  const qiudaoDateSolar = watch("qiudaoDateSolar");

  // Auto-calculate lunar date when solar date changes
  useEffect(() => {
    if (qiudaoDateSolar) {
      try {
        const lunar = lunisolar(qiudaoDateSolar);
        const lunarStr = `${lunar.format("cY年lMMMM lD")}`;
        setLunarDate(lunarStr);
      } catch (e) {
        setLunarDate("");
      }
    } else {
      setLunarDate("");
    }
  }, [qiudaoDateSolar]);

  // Reset form when user data is loaded
  useEffect(() => {
    if (user && !userIsLoading) {
      reset({
        qiudaoDateSolar: user.qiudaoDateSolar
          ? new Date(user.qiudaoDateSolar).toISOString().split("T")[0]
          : "",
        qiudaoTemple: user.qiudaoTemple ?? "",
        qiudaoTanzhu: user.qiudaoTanzhu ?? "",
        affiliation: user.affiliation ?? "",
        dianChuanShi: user.dianChuanShi ?? "",
        yinShi: user.yinShi ?? "",
        baoShi: user.baoShi ?? "",
      });
      setQiudaoHour(user.qiudaoHour ?? "");
    }
  }, [user, userIsLoading, reset]);

  if (userIsLoading) return <div className="loading" />;
  if (userError) return <AlertWarning>{userError.message}</AlertWarning>;
  if (!user) return <AlertWarning>找不到用戶資料</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <div className="alert alert-info">
        <span>用戶：{user.name}</span>
      </div>
      <form
        className="form-control space-y-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <label className="label">
            <span className="label-text">求道日期（國曆）</span>
          </label>
          <input
            type="date"
            className="input input-bordered w-full"
            {...register("qiudaoDateSolar")}
          />
        </div>

        <QiudaoLunarDisplay
          solarDate={qiudaoDateSolar}
          hour={qiudaoHour}
          onHourChange={setQiudaoHour}
        />
        <div>
          <label className="label">
            <span className="label-text">求道佛堂</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("qiudaoTemple")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">壇主（姓名）</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("qiudaoTanzhu")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">所屬單位</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("affiliation")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">點傳師</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("dianChuanShi")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">引師</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("yinShi")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">保師</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("baoShi")}
          />
        </div>
        <div className="flex flex-row justify-end space-x-4">
          <ReactiveButton
            className="btn btn-primary"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={handleSubmit((data) =>
              updateUserQiudaoInfo({
                userId,
                qiudaoDateSolar: data.qiudaoDateSolar
                  ? new Date(data.qiudaoDateSolar)
                  : null,
                qiudaoHour: qiudaoHour || null,
                qiudaoTemple: data.qiudaoTemple || null,
                qiudaoTanzhu: data.qiudaoTanzhu || null,
                affiliation: data.affiliation || null,
                dianChuanShi: data.dianChuanShi || null,
                yinShi: data.yinShi || null,
                baoShi: data.baoShi || null,
              }),
            )}
            loading={updateUserQiudaoInfoIsPending}
            isSuccess={updateUserQiudaoInfoIsSuccess}
            error={updateUserQiudaoInfoError?.message}
          >
            儲存
          </ReactiveButton>
        </div>
      </form>
    </div>
  );
}

enum SortedType {
  NAME = 0,
  IS_TIANI_ADMIN = 1,
  IS_VOLUNTEER_ADMIN = 2,
  IS_YIDECLASS_ADMIN = 3,
  IS_ETOGETHER_ADMIN = 4,
  IS_YIDEWORK_ADMIN = 5,
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
  } = api.user.getUsers.useQuery();

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
  const { mutate: setIsYideworkAdmin } =
    api.user.setIsYideworkAdmin.useMutation({
      onSettled: () => usersRefetch(),
    });
  const { mutate: setIsEtogetherAdmin } =
    api.user.setIsEtogetherAdmin.useMutation({
      onSettled: () => usersRefetch(),
    });

  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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
      <div className=" h-[calc(100vh-11rem)] overflow-x-auto">
        <table className="table-pin-rows table-sm table">
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
              <th>個人資料</th>
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
                    onChange={(e) =>
                      setIsTianiAdmin({
                        userId: user.id,
                        isAdmin: e.target.checked,
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
                    onChange={(e) =>
                      setIsVolunteerAdmin({
                        userId: user.id,
                        isAdmin: e.target.checked,
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
                    onChange={(e) =>
                      setIsYideclassAdmin({
                        userId: user.id,
                        isAdmin: e.target.checked,
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
                    onChange={(e) =>
                      setIsYideworkAdmin({
                        userId: user.id,
                        isAdmin: e.target.checked,
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
                    onChange={(e) =>
                      setIsEtogetherAdmin({
                        userId: user.id,
                        isAdmin: e.target.checked,
                      })
                    }
                  />
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setUserProfileDialogOpen(true);
                    }}
                  >
                    <UserIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog
        title="個人資料"
        show={userProfileDialogOpen}
        closeModal={() => {
          setUserProfileDialogOpen(false);
          setSelectedUserId(null);
        }}
      >
        {selectedUserId && (
          <UserProfileDialogContent
            userId={selectedUserId}
            onClose={() => {
              setUserProfileDialogOpen(false);
              setSelectedUserId(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
