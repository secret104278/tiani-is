import { useClose } from "@headlessui/react";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";
import { VOLUNTEER_WORK_ROLES } from "~/utils/ui";

interface WorkParticipateDialogContentProps {
  activityId: number;
  title: string;
  onSuccess?: () => void;
}

export default function WorkParticipateDialogContent({
  activityId,
  onSuccess,
}: WorkParticipateDialogContentProps) {
  const close = useClose();
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  const utils = api.useUtils();

  const { isLoading: activityIsLoading, error: activityError } =
    api.workActivity.getActivity.useQuery({
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

  const handleParticipate = () => {
    if (selectedRoles.size === 0) return;

    participateActivity({
      activityId,
      roles: Array.from(selectedRoles),
    });

    setSelectedRoles(new Set());
  };

  const toggleRole = (role: string) => {
    const newSelected = new Set(selectedRoles);
    const COOPERATE_ROLE = "配合安排";

    if (role === COOPERATE_ROLE) {
      if (newSelected.has(COOPERATE_ROLE)) {
        newSelected.delete(COOPERATE_ROLE);
      } else {
        newSelected.clear();
        newSelected.add(COOPERATE_ROLE);
      }
    } else {
      if (newSelected.has(role)) {
        newSelected.delete(role);
      } else {
        newSelected.delete(COOPERATE_ROLE);
        newSelected.add(role);
      }
    }
    setSelectedRoles(newSelected);
  };

  if (activityIsLoading) return <div className="loading loading-spinner" />;

  if (activityError) {
    return <AlertWarning>{activityError.message}</AlertWarning>;
  }

  const cooperateRole = VOLUNTEER_WORK_ROLES[0];
  const otherRoles = VOLUNTEER_WORK_ROLES.slice(1);

  return (
    <div className="space-y-4">
      {participateActivityError && (
        <AlertWarning>{participateActivityError.message}</AlertWarning>
      )}

      <div>
        <label className="label">
          <span className="label-text font-semibold">選擇您要學習的項目</span>
        </label>
        <div className="space-y-4">
          {/* Cooperate Role */}
          {cooperateRole && (
            <label className="label cursor-pointer justify-start gap-3 rounded-lg border border-primary bg-primary/5 p-3">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={selectedRoles.has(cooperateRole)}
                onChange={() => toggleRole(cooperateRole)}
              />
              <span className="label-text font-bold text-primary">
                {cooperateRole}
              </span>
            </label>
          )}

          <div className="divider text-xs opacity-50">或是選擇特定項目</div>

          {/* Other Roles */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {otherRoles.map((role) => (
              <label
                key={role}
                className="label cursor-pointer justify-start gap-3 rounded-lg border border-base-300 bg-base-100 p-3"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={selectedRoles.has(role)}
                  onChange={() => toggleRole(role)}
                />
                <span className="label-text font-medium">{role}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="divider" />

      <ReactiveButton
        type="button"
        className="btn btn-primary w-full"
        onClick={handleParticipate}
        loading={participateActivityIsPending}
        disabled={selectedRoles.size === 0}
      >
        我可以參與幫辦
      </ReactiveButton>
    </div>
  );
}
