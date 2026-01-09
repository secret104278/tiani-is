import type { WorkAssignments } from "~/utils/types";

interface WorkAssignmentsDisplayProps {
  assignments: WorkAssignments;
}

const ASSIGNMENT_ROLES = [
  { key: "generalConvener", label: "總招集" },
  { key: "expoundingTao", label: "開釋道義" },
  { key: "conductor", label: "操持" },
  { key: "documentPresentation", label: "表文" },
  { key: "offering", label: "獻供" },
  { key: "kneelingReception", label: "跪接" },
  { key: "servingFruit", label: "端果" },
  { key: "arrangingFruit", label: "整果" },
  { key: "invokingAltar", label: "請壇" },
  { key: "accompanyingAltar", label: "陪壇" },
  { key: "performingCeremony", label: "辦道" },
  { key: "guardingAltar", label: "護壇" },
  { key: "transmittingMasterService", label: "點傳師服務 / 講師服務" },
  { key: "towelsAndTea", label: "毛巾 & 茶水" },
  { key: "threeTreasures", label: "三寶" },
];

export default function WorkAssignmentsDisplay({
  assignments,
}: WorkAssignmentsDisplayProps) {
  return (
    <div className="space-y-3">
      {ASSIGNMENT_ROLES.map((role) => {
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
