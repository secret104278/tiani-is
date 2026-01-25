import { useFormContext, useWatch } from "react-hook-form";
import SuggestiveInput from "~/components/inputs/SuggestiveInput";
import type { WorkAssignments } from "~/utils/types";
import type { MASTER_WORK_ROLES } from "~/utils/ui";

interface WorkAssignmentsSectionProps {
  roleDefinitions: (typeof MASTER_WORK_ROLES)[number][];
  staffNames?: string[];
}

export default function WorkAssignmentsSection({
  roleDefinitions,
  staffNames = [],
}: WorkAssignmentsSectionProps) {
  const { setValue, control } = useFormContext<{
    assignments: WorkAssignments;
  }>();
  const assignments = useWatch({
    control,
    name: "assignments",
  });

  const handleSingleChange = (roleKey: string, value: string) => {
    const updated = { ...(assignments || {}) };
    if (value) {
      (updated as Record<string, string | object | string>)[roleKey] = value;
    } else {
      delete (updated as Record<string, string | object | string>)[roleKey];
    }
    setValue("assignments", updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleDualChange = (
    roleKey: string,
    position: "upper" | "lower",
    value: string,
  ) => {
    const updated = { ...(assignments || {}) };
    const current = updated[roleKey as keyof WorkAssignments];

    if (
      typeof current === "object" &&
      current !== null &&
      !Array.isArray(current)
    ) {
      const roleObj = { ...current } as Record<string, string>;
      if (value) {
        roleObj[position] = value;
      } else {
        delete roleObj[position];
      }

      if (Object.keys(roleObj).length === 0) {
        delete updated[roleKey as keyof WorkAssignments];
      } else {
        (updated as Record<string, Record<string, string>>)[roleKey] = roleObj;
      }
    } else if (value) {
      (updated as Record<string, Record<string, string>>)[roleKey] = {
        [position]: value,
      };
    }

    setValue("assignments", updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleMultipleChange = (roleKey: string, value: string) => {
    const updated = { ...(assignments || {}) };
    if (value) {
      (updated as Record<string, string>)[roleKey] = value;
    } else {
      delete (updated as Record<string, string>)[roleKey];
    }
    setValue("assignments", updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const getSingleValue = (roleKey: string): string => {
    if (!assignments) return "";
    const value = assignments[roleKey as keyof WorkAssignments];
    return typeof value === "string" ? value : "";
  };

  const getDualValues = (
    roleKey: string,
  ): {
    upper: string;
    lower: string;
  } => {
    if (!assignments) return { upper: "", lower: "" };
    const role = assignments[roleKey as keyof WorkAssignments];
    if (typeof role === "object" && role !== null && !Array.isArray(role)) {
      const roleObj = role as Record<string, string>;
      return {
        upper: roleObj?.upper || "",
        lower: roleObj?.lower || "",
      };
    }
    return { upper: "", lower: "" };
  };

  const getMultipleValue = (roleKey: string): string => {
    if (!assignments) return "";
    const value = assignments[roleKey as keyof WorkAssignments];
    return typeof value === "string" ? value : "";
  };

  return (
    <div className="space-y-4">
      <div className="divider">工作分配</div>

      {roleDefinitions.map((role) => (
        <div key={role.key}>
          {role.type === "single" && (
            <div>
              <label className="label">
                <span className="label-text text-sm">{role.label}</span>
              </label>
              <SuggestiveInput
                type="text"
                className="tiani-input"
                value={getSingleValue(role.key)}
                options={staffNames}
                onChange={(e) => handleSingleChange(role.key, e.target.value)}
              />
            </div>
          )}

          {role.type === "dual" && (
            <div className="space-y-2">
              <label className="label">
                <span className="label-text text-sm">{role.label}</span>
              </label>
              <div className="flex gap-2">
                <SuggestiveInput
                  type="text"
                  className="tiani-input flex-1"
                  placeholder="上首"
                  value={getDualValues(role.key).upper}
                  options={staffNames}
                  onChange={(e) =>
                    handleDualChange(role.key, "upper", e.target.value)
                  }
                />
                <SuggestiveInput
                  type="text"
                  className="tiani-input flex-1"
                  placeholder="下首"
                  value={getDualValues(role.key).lower}
                  options={staffNames}
                  onChange={(e) =>
                    handleDualChange(role.key, "lower", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {role.type === "multiple" && (
            <div>
              <label className="label">
                <span className="label-text text-sm">{role.label}</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="逗號分隔"
                rows={2}
                value={getMultipleValue(role.key)}
                onChange={(e) => handleMultipleChange(role.key, e.target.value)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
