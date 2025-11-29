import { zodResolver } from "@hookform/resolvers/zod";
import { isNumber, round } from "lodash";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { differenceInHoursNoRound, getDateTimeString } from "~/utils/ui";
import { ControlledDateTimeField, NumberField } from "../Form/shared";
import ReactiveButton from "../utils/ReactiveButton";

const modifyCheckRecordSchema = z.object({
  checkInAt: z.coerce.date(),
  checkOutAt: z.coerce.date(),
  workHours: z.number(),
});

type ModifyCheckRecordDialogForm = z.infer<typeof modifyCheckRecordSchema>;

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
  const { register, handleSubmit, setValue, watch, control } =
    useForm<ModifyCheckRecordDialogForm>({
      resolver: zodResolver(modifyCheckRecordSchema),
      mode: "all",
      defaultValues: {
        checkInAt: defaultCheckInAt ?? new Date(),
        checkOutAt: defaultCheckOutAt ?? new Date(),
        workHours:
          defaultCheckInAt && defaultCheckOutAt
            ? round(
                differenceInHoursNoRound(defaultCheckOutAt, defaultCheckInAt),
                2,
              )
            : 0,
      },
    });

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // Type guard to ensure values are defined
      const checkInAt = value.checkInAt;
      const checkOutAt = value.checkOutAt;
      const workHours = value.workHours;

      if (
        ((name === "workHours" && type === "change") ||
          (name === "checkInAt" && type === "change")) &&
        isNumber(workHours) &&
        Number.isFinite(workHours) &&
        checkInAt
      ) {
        setValue(
          "checkOutAt",
          new Date(checkInAt.getTime() + workHours * 60 * 60 * 1000),
        );
      }

      if (
        name === "checkOutAt" &&
        type === "change" &&
        checkOutAt &&
        checkInAt
      ) {
        setValue(
          "workHours",
          round(differenceInHoursNoRound(checkOutAt, checkInAt), 2),
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [setValue, watch]);

  return (
    <form className="form-control flex flex-col space-y-4">
      <label className="label">
        <span className="label-text">志工：{userName}</span>
      </label>
      <ControlledDateTimeField
        label="簽到時間"
        required
        control={control}
        name="checkInAt"
      />
      <div className="divider" />
      <NumberField
        label="工時"
        required
        inputMode="decimal"
        step={0.01}
        {...register("workHours", { valueAsNumber: true })}
      />
      <ControlledDateTimeField
        label="簽退時間"
        required
        control={control}
        name="checkOutAt"
      />
      <ReactiveButton
        className="btn btn-primary"
        onClick={handleSubmit((data) =>
          onConfirm?.(data.checkInAt, data.checkOutAt),
        )}
        loading={isLoading}
        error={error}
      >
        確認
      </ReactiveButton>
    </form>
  );
}
