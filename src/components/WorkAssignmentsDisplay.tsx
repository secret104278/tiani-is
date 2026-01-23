import type { WorkAssignments } from "~/utils/types";
import { MASTER_WORK_ROLES } from "~/utils/ui";

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

  return (
    <div className="space-y-3">
      {rolesToDisplay.map((role) => {
        const value = assignments[role.key as keyof WorkAssignments];

        if (!value) return null;

        if (typeof value === "string") {
          return (
            <div key={role.key} className="flex flex-col gap-1">
              <p className="text font-semibold">{role.label}</p>
              <p className="text ml-4">{value}</p>
            </div>
          );
        }

        const dualValue = value;
        const hasValue = dualValue.upper || dualValue.lower;

        if (!hasValue) return null;

        return (
          <div key={role.key} className="flex flex-col gap-1">
            <p className="text font-semibold">{role.label}</p>
            <div className="text ml-4 space-y-1">
              {dualValue.upper && <p>上首：{dualValue.upper}</p>}
              {dualValue.lower && <p>下首：{dualValue.lower}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
