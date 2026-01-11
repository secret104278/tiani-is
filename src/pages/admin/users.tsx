import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { Role } from "@prisma/client";
import { isEmpty } from "lodash";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import LineImage from "~/components/utils/LineImage";
import { Loading } from "~/components/utils/Loading";
import { api } from "~/utils/api";
import { UNITS } from "~/utils/ui";

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
          // Safety: Don't allow self-removal of Tiani Admin or modification if user is Tiani Admin (except for Tiani Admin role itself)
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

export default function AdminUsersPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>("義德");
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");

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

    // Optimistically update local state for the dialog UI
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
        const matchRole =
          roleFilter === "ALL" ||
          u.roles.includes(roleFilter) ||
          (roleFilter !== Role.TIANI_ADMIN &&
            u.roles.includes(Role.TIANI_ADMIN));
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

  if (usersIsLoading) return <Loading />;
  if (!isEmpty(usersError))
    return <AlertWarning>{usersError.message}</AlertWarning>;

  return (
    <div className="mx-auto max-w-md space-y-4 pb-20">
      <div className="px-1 pt-4">
        <h1 className="font-black text-2xl tracking-tight">權限管理</h1>
      </div>

      {/* Sticky Header with Unit, Role, and Name Filter */}
      <div className="sticky top-0 z-30 space-y-3 bg-base-100/95 px-1 pt-2 pb-4 backdrop-blur">
        {/* 1. Unit Selector */}
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

        {/* 2. Role Quick Filter */}
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
        </div>

        {/* 3. Name Search */}
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

      {/* Staff Section */}
      <section className="space-y-2 px-1">
        <h2 className="flex items-center gap-1 px-2 font-bold text-sm uppercase opacity-60">
          <ShieldCheckIcon className="h-4 w-4" /> 權限管理人員 ({staff.length})
        </h2>
        {staff.length === 0 ? (
          <div className="py-6 text-center text-sm italic opacity-30">
            尚無權限人員
          </div>
        ) : (
          staff.map((user) => (
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
                  <p className="font-bold text-base leading-none">
                    {user.name}
                  </p>
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
          ))
        )}
      </section>

      {/* Regular Users Section */}
      <section className="space-y-1 px-1">
        <h2 className="px-2 pt-4 font-bold text-sm uppercase opacity-60">
          一般人員 ({regular.length})
        </h2>
        {regular.length === 0 ? (
          <div className="py-6 text-center text-sm italic opacity-30">
            查無名單
          </div>
        ) : (
          <div className="divide-y divide-base-100 rounded-xl border border-base-200 bg-base-100">
            {regular.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-base-200">
                    <UserIcon className="h-5 w-5 opacity-30" />
                  </div>
                  <span className="font-medium text-base">{user.name}</span>
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
        )}
      </section>

      {/* Careful UI Dialog */}
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
    </div>
  );
}
