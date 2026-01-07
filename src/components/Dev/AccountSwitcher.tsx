"use client";

import { Check, ChevronRight, Search, User as UserIcon, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import LineImage from "../utils/LineImage";

export default function AccountSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: session } = useSession();
  const { data: users, isLoading } = api.user.getDevUsers.useQuery(undefined, {
    refetchOnWindowFocus: false,
    enabled: isOpen,
  });

  if (process.env.NODE_ENV !== "development") return null;

  const handleSwitch = (userId: string) => {
    window.location.href = `/api/dev/login?userId=${userId}&callbackUrl=${encodeURIComponent(
      window.location.href,
    )}`;
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(
      (user) =>
        (user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        user.roles.some((role) =>
          role.toLowerCase().includes(search.toLowerCase()),
        ),
    );
  }, [users, search]);

  return (
    <div className="fixed bottom-4 left-4 z-[100] font-sans">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-all duration-200",
          isOpen
            ? "rotate-90 bg-base-200 text-base-content hover:bg-base-300"
            : "bg-primary text-primary-content hover:scale-105 active:scale-95",
        )}
      >
        {isOpen ? <X className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
      </button>

      {/* Menu */}
      {isOpen && (
        <div className="fade-in slide-in-from-bottom-2 absolute bottom-14 left-0 flex w-72 animate-in flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xl duration-200">
          {/* Search */}
          <div className="relative border-base-200 border-b">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-3.5 w-3.5 text-base-content/30" />
            <input
              type="text"
              placeholder="搜尋帳號..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent py-2.5 pr-3 pl-9 text-xs focus:outline-none"
            />
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto bg-base-100">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-xs opacity-20" />
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isActive = session?.user?.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSwitch(user.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                      isActive ? "bg-primary/5" : "hover:bg-base-200",
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={cn(
                          "h-8 w-8 overflow-hidden rounded-full border border-base-300 bg-base-200",
                          isActive &&
                            "border-primary/50 ring-1 ring-primary/30",
                        )}
                      >
                        {
                          <div className="flex h-full w-full items-center justify-center font-bold text-[10px] text-base-content/40 uppercase">
                            {user.name?.[0] || "?"}
                          </div>
                        }
                      </div>
                      {isActive && (
                        <div className="-bottom-0.5 -right-0.5 absolute rounded-full bg-primary p-0.5 text-primary-content">
                          <Check className="h-2 w-2" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "truncate font-medium text-[13px]",
                            isActive ? "text-primary" : "text-base-content",
                          )}
                        >
                          {user.name || "Unknown"}
                        </span>
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-30" />
                      </div>
                      <div className="truncate text-[10px] text-base-content/50">
                        {user.roles.length > 0
                          ? user.roles[0]?.replace("_ADMIN", "")
                          : "User"}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-[11px] text-base-content/40">
                查無結果
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
