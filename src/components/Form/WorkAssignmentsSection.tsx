import { useFormContext, useWatch } from "react-hook-form";
import type { WorkAssignments } from "~/utils/types";

const ASSIGNMENT_ROLES = [
  { key: "generalConvener", label: "總招集", type: "single" },
  { key: "expoundingTao", label: "開釋道義", type: "single" },
  { key: "conductor", label: "操持", type: "single" },
  { key: "documentPresentation", label: "表文", type: "single" },
  { key: "offering", label: "獻供", type: "dual" },
  { key: "kneelingReception", label: "跪接", type: "dual" },
  { key: "servingFruit", label: "端果", type: "single" },
  { key: "arrangingFruit", label: "整果", type: "multiple" },
  { key: "invokingAltar", label: "請壇", type: "dual" },
  { key: "accompanyingAltar", label: "陪壇", type: "multiple" },
  { key: "performingCeremony", label: "辦道", type: "dual" },
  { key: "guardingAltar", label: "護壇", type: "multiple" },
  {
    key: "transmittingMasterService",
    label: "點傳師服務 / 講師服務",
    type: "multiple",
  },
  { key: "towelsAndTea", label: "毛巾 & 茶水", type: "multiple" },
  { key: "threeTreasures", label: "三寶", type: "single" },
];

export default function WorkAssignmentsSection({
  title,
}: {
  title: string;
}) {
  const { setValue, control } = useFormContext<{
    assignments: WorkAssignments;
  }>();
  const assignments = useWatch({
    control,
    name: "assignments",
  });

  const isOffering = title === "獻供通知";
  const filteredRoles = isOffering
    ? ASSIGNMENT_ROLES.filter((role) =>
        [
          "offering",
          "kneelingReception",
          "servingFruit",
          "arrangingFruit",
        ].includes(role.key),
      )
    : ASSIGNMENT_ROLES;

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

      {filteredRoles.map((role) => (
        <div key={role.key}>
          {role.type === "single" && (
            <div>
              <label className="label">
                <span className="label-text text-sm">{role.label}</span>
              </label>
              <input
                type="text"
                className="tiani-input"
                value={getSingleValue(role.key)}
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
                <input
                  type="text"
                  className="tiani-input flex-1"
                  placeholder="上首"
                  value={getDualValues(role.key).upper}
                  onChange={(e) =>
                    handleDualChange(role.key, "upper", e.target.value)
                  }
                />
                <input
                  type="text"
                  className="tiani-input flex-1"
                  placeholder="下首"
                  value={getDualValues(role.key).lower}
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
