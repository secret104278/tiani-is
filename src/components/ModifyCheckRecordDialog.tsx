import { isFinite, isNumber, round } from "lodash";
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

  workHours: number;
}

function ModifyCheckRecordDialogInner(
  props: ModifyCheckRecordDialogProps,
  ref: ForwardedRef<HTMLDialogElement>,
) {
  const router = useRouter();

  const { register, handleSubmit, setValue, watch } =
    useForm<ModifyCheckRecordDialogForm>({ mode: "all" });

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (
        ((name === "workHours" && type === "change") ||
          (name === "checkInAt" && type === "change")) &&
        isNumber(value.workHours) &&
        isFinite(value.workHours)
      ) {
        setValue(
          "checkOutAt",
          getDateTimeString(
            new Date(
              (value.checkInAt as Date).getTime() +
                value.workHours * 60 * 60 * 1000,
            ),
          ),
        );
      }

      if (name === "checkOutAt" && type === "change") {
        console.log(value.checkOutAt, value.checkInAt);
        setValue(
          "workHours",
          round(
            ((value.checkOutAt as Date).getTime() -
              (value.checkInAt as Date).getTime()) /
              60 /
              60 /
              1000,
            2,
          ),
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [setValue, watch]);

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

  useEffect(() => {
    setValue(
      "workHours",
      props.defaultCheckInAt && props.defaultCheckOutAt
        ? round(
            (props.defaultCheckOutAt.getTime() -
              props.defaultCheckInAt.getTime()) /
              60 /
              60 /
              1000,
            2,
          )
        : 0,
    );
  }, [props.defaultCheckInAt, props.defaultCheckOutAt, setValue]);

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
            <div className="divider" />
            <label className="label">
              <span className="label-text">工時</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              className="input input-bordered w-full invalid:input-error"
              step="0.01"
              required
              {...register("workHours", { valueAsNumber: true })}
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
