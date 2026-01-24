import { useClose } from "@headlessui/react";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";
import type { WorkAssignments } from "~/utils/types";
import { WORK_ASSIGNMENT_ROLES } from "~/utils/ui";

interface WorkParticipateDialogContentProps {
  activityId: number;
  title: string;
  onSuccess?: () => void;
}

export default function WorkParticipateDialogContent({
  activityId,
  title,
  onSuccess,
}: WorkParticipateDialogContentProps) {
  const close = useClose();
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  const utils = api.useUtils();

  const {
    data: activity,
    isLoading: activityIsLoading,
    error: activityError,
  } = api.workActivity.getActivity.useQuery({
    activityId,
  });

  const {
    mutate: participateActivity,
    isPending: participateActivityIsPending,
    error: participateActivityError,
  } = api.workActivity.participateActivity.useMutation({
    onSuccess: () => {
      void utils.workActivity.getActivity.invalidate();
      onSuccess?.();
      close();
    },
  });

  // Determine which roles to show
  const rolesConfig = activity?.rolesConfig as string[] | null;
  const availableRoles = rolesConfig
    ? WORK_ASSIGNMENT_ROLES.filter((role) => rolesConfig.includes(role.key))
    : title === "獻供通知"
      ? WORK_ASSIGNMENT_ROLES.filter((role) =>
          [
            "offering",
            "kneelingReception",
            "servingFruit",
            "arrangingFruit",
          ].includes(role.key),
        )
      : WORK_ASSIGNMENT_ROLES;

  const isOffering = title === "獻供通知";
  const showRoleSelection = !isOffering;

  // Get current assignments to check what's taken
  const assignments = (activity?.assignments || {}) as Partial<WorkAssignments>;

  // Get current assignees for a role
  const getAssignees = (roleKey: string): string => {
    const value = (assignments as Record<string, unknown>)[roleKey];
    if (!value) return "";

    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "object" && value !== null) {
      const names: string[] = [];
      const obj = value as Record<string, string>;
      if (obj.upper) names.push(`上首：${obj.upper}`);
      if (obj.lower) names.push(`下首：${obj.lower}`);
      return names.join(" / ");
    }
    return "";
  };

  const handleParticipate = () => {
    if (showRoleSelection && selectedRoles.size === 0) return;

    // Build array of roles to submit
    const roles: Array<{ roleKey: string; position?: "upper" | "lower" }> = [];

    if (showRoleSelection) {
      for (const selectedRole of selectedRoles) {
        if (selectedRole === "配合安排") {
          // Skip
        } else if (selectedRole.includes("-")) {
          const parts = selectedRole.split("-");
          const roleKey = parts[0];
          const position = parts[1];
          if (
            roleKey &&
            position &&
            (position === "upper" || position === "lower")
          ) {
            roles.push({
              roleKey,
              position: position as "upper" | "lower",
            });
          }
        } else {
          roles.push({
            roleKey: selectedRole,
          });
        }
      }
    }

    // Make single mutation call with all roles
    participateActivity({
      activityId,
      roles: roles.length > 0 ? roles : [],
    });

    // Clear selections after submitting
    setSelectedRoles(new Set());
  };

  const toggleRole = (roleKey: string) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleKey)) {
      newSelected.delete(roleKey);
    } else {
      newSelected.add(roleKey);
    }
    setSelectedRoles(newSelected);
  };

  if (activityIsLoading) return <div className="loading loading-spinner" />;

  if (activityError) {
    return <AlertWarning>{activityError.message}</AlertWarning>;
  }

  return (
    <div className="space-y-4">
      {participateActivityError && (
        <AlertWarning>{participateActivityError.message}</AlertWarning>
      )}

      {isOffering && (
        <div className="alert alert-info text-sm">
          <span>點擊下方按鈕即可報名，將由壇務安排工作。</span>
        </div>
      )}

      {showRoleSelection && (
        <div>
          <label className="label">
            <span className="label-text font-semibold">選擇您要學習的項目</span>
          </label>
          <div className="space-y-3">
            {/* 配合安排 option */}
            <div className="rounded-lg border border-base-300 bg-base-100 p-3">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selectedRoles.has("配合安排")}
                  onChange={() => toggleRole("配合安排")}
                />
                <span className="label-text flex-1">配合安排</span>
              </label>
            </div>

            <div className="divider my-2">學習項目</div>

            {/* Listed roles */}
            <div className="space-y-2">
              {availableRoles.map((role) => {
              const assignees = getAssignees(role.key);
              const value = assignments[role.key as keyof WorkAssignments];
              const isDual = role.type === "dual";

              // For dual roles, always show both positions as separate options
              if (
                isDual &&
                typeof value === "object" &&
                value !== null &&
                !("length" in value)
              ) {
                const dualValue = value as { upper?: string; lower?: string };
                return (
                  <div key={role.key} className="space-y-2">
                    {/* Show upper position */}
                    <label className="label cursor-pointer justify-start gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedRoles.has(`${role.key}-upper`)}
                        onChange={() => toggleRole(`${role.key}-upper`)}
                      />
                      <div className="flex-1 text-left">
                        <div className="label-text font-medium">
                          {role.label} (上首)
                        </div>
                        {dualValue.upper && (
                          <div className="mt-1 text-base-600 text-xs">
                            {dualValue.upper}
                          </div>
                        )}
                      </div>
                    </label>

                    {/* Show lower position */}
                    <label className="label cursor-pointer justify-start gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedRoles.has(`${role.key}-lower`)}
                        onChange={() => toggleRole(`${role.key}-lower`)}
                      />
                      <div className="flex-1 text-left">
                        <div className="label-text font-medium">
                          {role.label} (下首)
                        </div>
                        {dualValue.lower && (
                          <div className="mt-1 text-base-600 text-xs">
                            {dualValue.lower}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                );
              }

              // For single and multiple roles, show standard option
              return (
                <div key={role.key}>
                  <label className="label cursor-pointer justify-start gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedRoles.has(role.key)}
                      onChange={() => toggleRole(role.key)}
                    />
                    <div className="flex-1 text-left">
                      <div className="label-text font-medium">{role.label}</div>
                      {assignees && (
                        <div className="mt-1 text-base-600 text-xs">
                          {assignees}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}

      <div className="divider" />

      <ReactiveButton
        type="button"
        className="btn btn-primary w-full"
        onClick={handleParticipate}
        loading={participateActivityIsPending}
        disabled={showRoleSelection && selectedRoles.size === 0}
      >
        {isOffering ? "我可以參加" : "我可以參與幫辦"}
      </ReactiveButton>
    </div>
  );
}
