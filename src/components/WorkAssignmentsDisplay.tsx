import type { WorkAssignments } from "~/utils/types";
import { CUSTOM_ROLE_KEY, MASTER_WORK_ROLES } from "~/utils/ui";

interface WorkAssignmentsDisplayProps {
  assignments: WorkAssignments;
  rolesConfig?: string[] | null;
}

export default function WorkAssignmentsDisplay({
  assignments,
  rolesConfig,
}: WorkAssignmentsDisplayProps) {
  const rolesToDisplay = rolesConfig
    ? MASTER_WORK_ROLES.filter((r) => rolesConfig.includes(r.key))
    : MASTER_WORK_ROLES;

  const customRoles = (assignments as any)?.[CUSTOM_ROLE_KEY] as
    | { role: string; name: string }[]
    | undefined;

  return (
    <div className="space-y-3">
      {rolesToDisplay.map((role) => {
        const value = assignments[role.key as keyof WorkAssignments];

        if (role.type === "dual") {
          const dualValue = value as { upper?: string; lower?: string } | undefined;
          return (
            <div key={role.key} className="flex flex-col gap-1">
              <p className="text font-semibold">{role.label}</p>
              <div className="text ml-4 space-y-1">
                <p>上首：{dualValue?.upper || ""}</p>
                <p>下首：{dualValue?.lower || ""}</p>
              </div>
            </div>
          );
        }

        return (
          <div key={role.key} className="flex flex-col gap-1">
            <p className="text font-semibold">{role.label}</p>
            <p className="text ml-4">{(value as string) || ""}</p>
          </div>
        );
      })}

      {customRoles?.map((item, idx) => (
        <div key={idx} className="flex flex-col gap-1">
          <p className="text font-semibold">{item.role}</p>
          <p className="text ml-4">{item.name}</p>
        </div>
      ))}
    </div>
  );
}
