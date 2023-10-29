import { useRouter } from "next/router";
import type { ForwardedRef } from "react";
import { forwardRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { api } from "~/utils/api";
import { getDateTimeString } from "~/utils/ui";
import ReactiveButton from "./ReactiveButton";

export interface ModifyCheckRecordDialogProps {
  userName: string;
  userId: string;
  activityId: number;
  defaultCheckInAt?: Date;
  defaultCheckOutAt?: Date;
}

interface ModifyCheckRecordDialogForm {
  checkInAt: Date | string;
  checkOutAt: Date | string;
}

function ModifyCheckRecordDialogInner(
  props: ModifyCheckRecordDialogProps,
  ref: ForwardedRef<HTMLDialogElement>,
) {
  const router = useRouter();

  const { register, handleSubmit, setValue } =
    useForm<ModifyCheckRecordDialogForm>({
      defaultValues: {
        checkInAt: getDateTimeString(props.defaultCheckInAt ?? new Date()),
        checkOutAt: getDateTimeString(props.defaultCheckOutAt ?? new Date()),
      },
      mode: "all",
    });

  useEffect(() => {
    setValue(
      "checkInAt",
      getDateTimeString(props.defaultCheckInAt ?? new Date()),
    );
  }, [props.defaultCheckInAt, setValue]);

  useEffect(() => {
    setValue(
      "checkOutAt",
      getDateTimeString(props.defaultCheckOutAt ?? new Date()),
    );
  }, [props.defaultCheckOutAt, setValue]);

  const {
    mutate: modifyActivityCheckRecord,
    isLoading: modifyActivityCheckRecordIsLoading,
    error: modifyActivityCheckRecordError,
  } = api.volunteerActivity.modifyActivityCheckRecord.useMutation({
    onSuccess: () => router.reload(),
  });

  return (
    <dialog ref={ref} className="modal">
      <div className="modal-box">
        <h3 className="text-lg font-bold">補正紀錄</h3>
        <div className="py-4">
          <form className="form-control max-w-xs">
            <label className="label">
              <span className="label-text">志工：{props.userName}</span>
            </label>
            <label className="label">
              <span className="label-text">簽到時間</span>
            </label>
            <input
              type="datetime-local"
              className="input input-bordered w-full invalid:input-error"
              required
              {...register("checkInAt", { valueAsDate: true })}
            />
            <label className="label">
              <span className="label-text">簽退時間</span>
            </label>
            <input
              type="datetime-local"
              className="input input-bordered w-full invalid:input-error"
              required
              {...register("checkOutAt", { valueAsDate: true })}
            />
          </form>
        </div>
        <div className="modal-action">
          <form method="dialog" className="space-x-2">
            <button className="btn">取消</button>
            <ReactiveButton
              className="btn btn-primary"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleSubmit((data) =>
                modifyActivityCheckRecord({
                  activityId: props.activityId,
                  userId: props.userId,
                  checkInAt: data.checkInAt as Date,
                  checkOutAt: data.checkOutAt as Date,
                }),
              )}
              loading={modifyActivityCheckRecordIsLoading}
              error={modifyActivityCheckRecordError?.message}
            >
              確認
            </ReactiveButton>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

export const ModifyCheckRecordDialog = forwardRef(ModifyCheckRecordDialogInner);
