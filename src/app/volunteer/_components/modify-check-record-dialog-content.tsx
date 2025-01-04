"use client";

import { isNumber, round } from "lodash";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import ReactiveButton from "~/app/_components/basic/reactive-button";
import { differenceInHoursNoRound, getDateTimeString } from "~/utils/ui";

interface ModifyCheckRecordDialogForm {
  checkInAt: Date | string;
  checkOutAt: Date | string;

  workHours: number;
}

export default function ModifyCheckRecordDialogContent({
  defaultCheckInAt,
  defaultCheckOutAt,
  userName,

  onConfirm,
  isLoading,
  error,
}: {
  defaultCheckInAt?: Date;
  defaultCheckOutAt?: Date;

  userName: string;

  onConfirm?: (checkInAt: Date, checkOutAt: Date) => void;
  isLoading?: boolean;
  error?: string;
}) {
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
            differenceInHoursNoRound(
              value.checkOutAt as Date,
              value.checkInAt as Date,
            ),
            2,
          ),
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [setValue, watch]);

  useEffect(() => {
    setValue("checkInAt", getDateTimeString(defaultCheckInAt ?? new Date()));
  }, [defaultCheckInAt, setValue]);

  useEffect(() => {
    setValue("checkOutAt", getDateTimeString(defaultCheckOutAt ?? new Date()));
  }, [defaultCheckOutAt, setValue]);

  useEffect(() => {
    setValue(
      "workHours",
      defaultCheckInAt && defaultCheckOutAt
        ? round(
            differenceInHoursNoRound(defaultCheckOutAt, defaultCheckInAt),
            2,
          )
        : 0,
    );
  }, [defaultCheckInAt, defaultCheckOutAt, setValue]);

  return (
    <form className="form-control flex flex-col space-y-4">
      <label className="label">
        <span className="label-text">志工：{userName}</span>
      </label>
      <div>
        <label className="label">
          <span className="label-text">簽到時間</span>
        </label>
        <input
          type="datetime-local"
          className="tiani-input"
          required
          {...register("checkInAt", { valueAsDate: true })}
        />
      </div>
      <div className="divider" />
      <div>
        <label className="label">
          <span className="label-text">工時</span>
        </label>
        <input
          type="number"
          inputMode="decimal"
          className="tiani-input"
          step="0.01"
          required
          {...register("workHours", { valueAsNumber: true })}
        />
      </div>
      <div>
        <label className="label">
          <span className="label-text">簽退時間</span>
        </label>
        <input
          type="datetime-local"
          className="tiani-input"
          required
          {...register("checkOutAt", { valueAsDate: true })}
        />
      </div>
      <ReactiveButton
        className="btn btn-primary"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={handleSubmit((data) =>
          onConfirm?.(data.checkInAt as Date, data.checkOutAt as Date),
        )}
        loading={isLoading}
        error={error}
      >
        確認
      </ReactiveButton>
    </form>
  );
}
