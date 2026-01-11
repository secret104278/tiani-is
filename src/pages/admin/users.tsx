import { TZDate } from "@date-fns/tz";
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { Role } from "@prisma/client";
import { format } from "date-fns";
import { isEmpty } from "lodash";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { UserProfileForm } from "~/components/Form/UserProfileForm";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import LineImage from "~/components/utils/LineImage";
import { Loading } from "~/components/utils/Loading";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";
import type { UserProfileFormData } from "~/utils/types";
import { DEFAULT_TIMEZONE, UNITS } from "~/utils/ui";

interface AdminUser {
  id: string;
  name: string | null;
  roles: Role[];
  affiliation: string | null;
  image: string | null;
}

// --- Sub-component: Permission Editor ("Careful UI") ---
function RoleEditorDialog({
  user,
  onClose,
  onUpdate,
  isMe,
}: {
  user: AdminUser;
  onClose: () => void;
  onUpdate: (role: Role, val: boolean) => void;
  isMe: boolean;
}) {
  const roleLabels: Record<Role, string> = {
    [Role.TIANI_ADMIN]: "最高管理者",
    [Role.VOLUNTEER_ADMIN]: "志工隊管理者",
    [Role.YIDECLASS_ADMIN]: "班務網管理者",
    [Role.YIDEWORK_ADMIN]: "道務網管理者",
    [Role.ETOGETHER_ADMIN]: "活動e起來管理者",
  };

  const availableRoles = [
    Role.TIANI_ADMIN,
    Role.VOLUNTEER_ADMIN,
    Role.YIDECLASS_ADMIN,
    Role.YIDEWORK_ADMIN,
    Role.ETOGETHER_ADMIN,
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-base-200 p-3">
        <div className="avatar">
          <div className="w-10 rounded-full bg-base-300">
            {user.image ? (
              <LineImage src={user.image} alt={user.name ?? ""} />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserIcon className="h-6 w-6 opacity-20" />
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="font-bold">{user.name}</p>
          <p className="text-xs opacity-60">
            {user.affiliation ?? "未設定單位"}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {availableRoles.map((role) => {
          const isActive = user.roles.includes(role);
          const isTianiAdmin = user.roles.includes(Role.TIANI_ADMIN);
          const disabled =
            (role === Role.TIANI_ADMIN && isMe) ||
            (role !== Role.TIANI_ADMIN && isTianiAdmin);

          return (
            <div
              key={role}
              className={`flex items-center justify-between rounded-lg border border-base-200 p-3 ${disabled ? "opacity-50" : ""}`}
            >
              <span className="font-medium text-sm">{roleLabels[role]}</span>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={isActive}
                disabled={disabled}
                onChange={(e) => onUpdate(role, e.target.checked)}
              />
            </div>
          );
        })}
      </div>
      <div className="pt-2">
        <button className="btn btn-block btn-ghost" onClick={onClose}>
          關閉
        </button>
      </div>
    </div>
  );
}

function CreateUserDialogContent({ onClose }: { onClose: () => void }) {
  const {
    mutate: createUser,
    isPending: createUserIsPending,
    error: createUserError,
  } = api.user.createUser.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

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

function UserProfileDialogContent({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
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
      onClose();
    },
  });

  if (userIsLoading) return <Loading />;
  if (userError) return <AlertWarning>{userError.message}</AlertWarning>;
  if (!user) return <AlertWarning>找不到用戶資料</AlertWarning>;

  const initialData: Partial<UserProfileFormData> = {
    qiudaoDateSolar: user.qiudaoDateSolar
      ? new Date(user.qiudaoDateSolar).toISOString().split("T")[0]
      : "",
    qiudaoHour: user.qiudaoHour ?? "",
    qiudaoTemple: user.qiudaoTemple ?? "",
    qiudaoTanzhu: user.qiudaoTanzhu ?? "",
    affiliation: user.affiliation ?? "",
    dianChuanShi: user.dianChuanShi ?? "",
    yinShi: user.yinShi ?? "",
    baoShi: user.baoShi ?? "",
  };

  const handleFormSubmit = (data: UserProfileFormData) => {
    updateUserQiudaoInfo({
      userId,
      qiudaoDateSolar: data.qiudaoDateSolar
        ? new Date(data.qiudaoDateSolar)
        : null,
      qiudaoHour: data.qiudaoHour || null,
      qiudaoTemple: data.qiudaoTemple || null,
      qiudaoTanzhu: data.qiudaoTanzhu || null,
      affiliation: data.affiliation || null,
      dianChuanShi: data.dianChuanShi || null,
      yinShi: data.yinShi || null,
      baoShi: data.baoShi || null,
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="alert alert-info">
        <span>用戶：{user.name}</span>
      </div>
      <UserProfileForm
        initialData={initialData}
        onSubmit={handleFormSubmit}
        isLoading={updateUserQiudaoInfoIsPending}
        isSuccess={updateUserQiudaoInfoIsSuccess}
        error={updateUserQiudaoInfoError?.message}
        showNameField={false}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>("義德");
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [roleFilter, setRoleFilter] = useState<Role | "ALL" | "NONE">("ALL");
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const roleLabels: Record<Role, string> = {
    [Role.TIANI_ADMIN]: "最高",
    [Role.VOLUNTEER_ADMIN]: "志工",
    [Role.YIDECLASS_ADMIN]: "班務",
    [Role.YIDEWORK_ADMIN]: "道務",
    [Role.ETOGETHER_ADMIN]: "活動",
  };

  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
    refetch: usersRefetch,
  } = api.user.getUsers.useQuery();

  const { data: sessionData } = useSession();

  // Mutations
  const { mutate: setIsTianiAdmin } = api.user.setIsTianiAdmin.useMutation({
    onSettled: () => void usersRefetch(),
  });
  const { mutate: setIsVolunteerAdmin } =
    api.user.setIsVolunteerAdmin.useMutation({
      onSettled: () => void usersRefetch(),
    });
  const { mutate: setIsClassAdmin } = api.user.setIsClassAdmin.useMutation({
    onSettled: () => void usersRefetch(),
  });
  const { mutate: setIsWorkAdmin } = api.user.setIsWorkAdmin.useMutation({
    onSettled: () => void usersRefetch(),
  });
  const { mutate: setIsEtogetherAdmin } =
    api.user.setIsEtogetherAdmin.useMutation({
      onSettled: () => void usersRefetch(),
    });

  const handleRoleUpdate = (role: Role, val: boolean) => {
    if (!editingUser) return;
    const input = { userId: editingUser.id, isAdmin: val };

    switch (role) {
      case Role.TIANI_ADMIN:
        setIsTianiAdmin(input);
        break;
      case Role.VOLUNTEER_ADMIN:
        setIsVolunteerAdmin(input);
        break;
      case Role.YIDECLASS_ADMIN:
        setIsClassAdmin(input);
        break;
      case Role.YIDEWORK_ADMIN:
        setIsWorkAdmin(input);
        break;
      case Role.ETOGETHER_ADMIN:
        setIsEtogetherAdmin(input);
        break;
    }

    setEditingUser((prev) => {
      if (!prev) return null;
      let newRoles = [...prev.roles];
      if (val) {
        newRoles.push(role);
      } else {
        newRoles = newRoles.filter((r) => r !== role);
      }
      return { ...prev, roles: newRoles };
    });
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users
      .filter((u) => {
        const matchUnit =
          selectedUnit === "其他"
            ? !u.affiliation ||
              !UNITS.some((unit) => unit.name === u.affiliation)
            : u.affiliation === selectedUnit;
        const matchSearch =
          u.name?.toLowerCase().includes(search.toLowerCase()) ?? false;

        let matchRole = false;
        if (roleFilter === "ALL") {
          matchRole = true;
        } else if (roleFilter === "NONE") {
          matchRole = u.roles.length === 0;
        } else {
          matchRole =
            u.roles.includes(roleFilter) || u.roles.includes(Role.TIANI_ADMIN);
        }

        return matchUnit && matchSearch && matchRole;
      })
      .sort((a, b) => {
        const nameA = a.name ?? "";
        const nameB = b.name ?? "";
        return nameA.localeCompare(nameB, "zh-Hant-TW");
      });
  }, [users, selectedUnit, search, roleFilter]);

  const staff = useMemo(
    () => filteredUsers.filter((u) => u.roles.length > 0),
    [filteredUsers],
  );
  const regular = useMemo(
    () => filteredUsers.filter((u) => u.roles.length === 0),
    [filteredUsers],
  );

  if (!sessionData?.user.role.is_tiani_admin) {
    return <AlertWarning>只有最高管理者可以進行此操作</AlertWarning>;
  }
  if (usersIsLoading) return <Loading />;
  if (!isEmpty(usersError)) {
    if (
      usersError.data?.code === "UNAUTHORIZED" ||
      usersError.data?.code === "FORBIDDEN"
    ) {
      window.location.href = "/auth/signin";
      return null;
    }
    return <AlertWarning>{usersError.message}</AlertWarning>;
  }

  return (
    <div className="mx-auto max-w-md space-y-4 pb-20">
      <div className="flex items-center justify-between px-1 pt-4">
        <h1 className="font-black text-2xl tracking-tight">權限管理</h1>
        <button
          className="btn btn-ghost btn-sm gap-1"
          onClick={() => setCreateUserDialogOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          新增帳號
        </button>
      </div>

      <div className="sticky top-0 z-30 space-y-3 bg-base-100/95 px-1 pt-2 pb-4 backdrop-blur">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto py-1">
          {[...UNITS, { name: "其他" }].map((u) => (
            <button
              key={u.name}
              onClick={() => setSelectedUnit(u.name)}
              className={`btn btn-sm h-10 flex-shrink-0 rounded-lg border-none px-4 ${
                selectedUnit === u.name
                  ? "bg-base-content font-bold text-base-100"
                  : "bg-base-200 opacity-70"
              }`}
            >
              {u.name}
            </button>
          ))}
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto py-1">
          <button
            onClick={() => setRoleFilter("ALL")}
            className={`btn btn-sm h-10 flex-shrink-0 rounded-lg border-none px-4 ${roleFilter === "ALL" ? "bg-primary font-bold text-primary-content" : "bg-base-200 opacity-70"}`}
          >
            全部
          </button>
          {Object.entries(roleLabels).map(([role, label]) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role as Role)}
              className={`btn btn-sm h-10 flex-shrink-0 rounded-lg border-none px-4 ${roleFilter === role ? "bg-primary font-bold text-primary-content" : "bg-base-200 opacity-70"}`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setRoleFilter("NONE")}
            className={`btn btn-sm h-10 flex-shrink-0 rounded-lg border-none px-4 ${roleFilter === "NONE" ? "bg-primary font-bold text-primary-content" : "bg-base-200 opacity-70"}`}
          >
            無權限
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute top-2.5 left-3 h-4 w-4 opacity-40" />
          <input
            className="input input-sm input-bordered h-10 w-full rounded-full pl-9"
            placeholder={`搜尋 ${selectedUnit} 的人員...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {staff.length > 0 && (
        <section className="space-y-2 px-1">
          <h2 className="flex items-center gap-1 px-2 font-bold text-sm uppercase opacity-60">
            <ShieldCheckIcon className="h-4 w-4" />{" "}
            {roleFilter === "ALL"
              ? "權限管理人員"
              : `${roleFilter === "NONE" ? "" : roleLabels[roleFilter as Role]}管理人員`}{" "}
            ({staff.length})
          </h2>
          {staff.map((user) => (
            <div
              key={user.id}
              className="card card-compact border border-primary/20 bg-primary/5 shadow-sm"
            >
              <div className="card-body flex-row items-center gap-3 p-3">
                <div className="avatar">
                  <div className="w-10 rounded-full border border-primary/30 bg-base-300">
                    {user.image ? (
                      <LineImage src={user.image} alt={user.name ?? ""} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserIcon className="h-6 w-6 opacity-20" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grow">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-base leading-none">
                      {user.name}
                    </p>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setUserProfileDialogOpen(true);
                      }}
                    >
                      詳情
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {user.roles.map((r: Role) => {
                      const labelMap: Record<Role, string> = {
                        [Role.TIANI_ADMIN]: "最高",
                        [Role.VOLUNTEER_ADMIN]: "志工",
                        [Role.YIDECLASS_ADMIN]: "班務",
                        [Role.YIDEWORK_ADMIN]: "道務",
                        [Role.ETOGETHER_ADMIN]: "活動",
                      };
                      return (
                        <span
                          key={r}
                          className="badge badge-primary badge-sm px-2 py-2.5 font-bold"
                        >
                          {labelMap[r] || r}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <button
                  className="btn btn-circle btn-ghost"
                  onClick={() => setEditingUser(user)}
                >
                  <AdjustmentsHorizontalIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {roleFilter === "ALL" && regular.length > 0 && (
        <section className="space-y-1 px-1">
          <h2 className="px-2 pt-4 font-bold text-sm uppercase opacity-60">
            一般人員 ({regular.length})
          </h2>
          <div className="divide-y divide-base-100 rounded-xl border border-base-200 bg-base-100">
            {regular.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex grow items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-base-200">
                    <UserIcon className="h-5 w-5 opacity-30" />
                  </div>
                  <div className="flex grow items-center justify-between gap-2">
                    <span className="font-medium text-base">{user.name}</span>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setUserProfileDialogOpen(true);
                      }}
                    >
                      詳情
                    </button>
                  </div>
                </div>
                <button
                  className="btn btn-circle btn-ghost"
                  onClick={() => setEditingUser(user)}
                >
                  <AdjustmentsHorizontalIcon className="h-6 w-6 text-primary" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {roleFilter === "NONE" && regular.length > 0 && (
        <section className="space-y-1 px-1">
          <h2 className="px-2 font-bold text-sm uppercase opacity-60">
            無權限人員 ({regular.length})
          </h2>
          <div className="divide-y divide-base-100 rounded-xl border border-base-200 bg-base-100">
            {regular.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex grow items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-base-200">
                    <UserIcon className="h-5 w-5 opacity-30" />
                  </div>
                  <div className="flex grow items-center justify-between gap-2">
                    <span className="font-medium text-base">{user.name}</span>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setUserProfileDialogOpen(true);
                      }}
                    >
                      詳情
                    </button>
                  </div>
                </div>
                <button
                  className="btn btn-circle btn-ghost"
                  onClick={() => setEditingUser(user)}
                >
                  <AdjustmentsHorizontalIcon className="h-6 w-6 text-primary" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {staff.length === 0 && regular.length === 0 && (
        <div className="py-20 text-center text-sm italic opacity-30">
          查無名單
        </div>
      )}

      <Dialog
        title="人員權限設定"
        show={!!editingUser}
        closeModal={() => setEditingUser(null)}
      >
        {editingUser && (
          <RoleEditorDialog
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onUpdate={handleRoleUpdate}
            isMe={editingUser.id === sessionData?.user.id}
          />
        )}
      </Dialog>

      <Dialog
        title="新增帳號"
        show={createUserDialogOpen}
        closeModal={() => setCreateUserDialogOpen(false)}
      >
        <CreateUserDialogContent
          onClose={() => {
            setCreateUserDialogOpen(false);
            void usersRefetch();
          }}
        />
      </Dialog>

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
              void usersRefetch();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
