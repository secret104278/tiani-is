import { TrashIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import UserCombobox, {
  type UserComboboxSelected,
} from "~/components/UserCombobox";
import { AlertWarning } from "~/components/utils/Alert";
import LineImage from "~/components/utils/LineImage";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";

interface YideWorkActivityStaffManagementProps {
  activityId: number;
}

export default function YideWorkActivityStaffManagement({
  activityId,
}: YideWorkActivityStaffManagementProps) {
  const [selectedUser, setSelectedUser] = useState<UserComboboxSelected>(null);

  const {
    data: staffs,
    isLoading: staffsIsLoading,
    error: staffsError,
  } = api.yideworkActivity.getStaffs.useQuery({
    activityId,
  });

  const apiUtils = api.useUtils();

  const {
    mutate: addStaff,
    isPending: addStaffIsPending,
    isError: addStaffIsError,
    error: addStaffError,
  } = api.yideworkActivity.addStaff.useMutation({
    onSuccess: () => {
      setSelectedUser(null);
      void apiUtils.yideworkActivity.getStaffs.invalidate();
    },
  });

  const {
    mutate: removeStaff,
    isPending: removeStaffIsPending,
    variables: removeStaffVariables,
  } = api.yideworkActivity.removeStaff.useMutation({
    onSuccess: () => {
      void apiUtils.yideworkActivity.getStaffs.invalidate();
    },
  });

  const handleAddStaff = () => {
    if (selectedUser?.id) {
      addStaff({
        activityId,
        userId: selectedUser.id,
      });
    }
  };

  const handleRemoveStaff = (userId: string) => {
    removeStaff({
      activityId,
      userId,
    });
  };

  if (staffsIsLoading) return <div className="loading loading-spinner" />;

  return (
    <div className="space-y-6">
      <div className="divider">工作人員管理</div>

      {staffsError && <AlertWarning>{staffsError.message}</AlertWarning>}
      {addStaffIsError && (
        <AlertWarning>{addStaffError?.message || "新增失敗"}</AlertWarning>
      )}

      <div className="space-y-3">
        <div className="relative z-10 flex gap-2">
          <div className="flex-1">
            <UserCombobox
              selected={selectedUser}
              setSelected={setSelectedUser}
            />
          </div>
          <ReactiveButton
            className="btn btn-primary btn-md"
            onClick={handleAddStaff}
            loading={addStaffIsPending}
            disabled={!selectedUser || addStaffIsPending}
          >
            新增
          </ReactiveButton>
        </div>
      </div>

      <form className="collapse-arrow collapse bg-base-200">
        <input type="checkbox" />
        <div className="collapse-title">
          {staffs?.length ? `工作人員清單 (${staffs?.length})` : "尚無工作人員"}
        </div>
        <div className="collapse-content">
          <ul className="space-y-2">
            {staffs?.map((staff) => (
              <li
                key={staff.user.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {staff.user.image ? (
                    <div className="avatar">
                      <div className="w-8 rounded-full">
                        <LineImage
                          src={staff.user.image}
                          alt={staff.user.name ?? ""}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="avatar placeholder">
                      <div className="w-8 rounded-full bg-neutral-focus text-neutral-content text-sm">
                        <span>{staff.user.name?.charAt(0)}</span>
                      </div>
                    </div>
                  )}
                  <span>{staff.user.name}</span>
                </div>
                <ReactiveButton
                  type="button"
                  className="btn btn-sm btn-error btn-square"
                  onClick={() => handleRemoveStaff(staff.user.id)}
                  loading={
                    removeStaffVariables?.userId === staff.user.id &&
                    removeStaffIsPending
                  }
                >
                  <TrashIcon className="h-4 w-4" />
                </ReactiveButton>
              </li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  );
}
