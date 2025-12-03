import { useForm } from "react-hook-form";
import ReactiveButton from "../utils/ReactiveButton";

import type { inferRouterInputs } from "@trpc/server";
import { isFinite as lodashIsFinite } from "lodash";
import { useMemo } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import type { YideWorkRouter } from "~/server/api/routers/yidework";
import {
  TEMPLE_GENDER_LABELS,
  calculateTempleGender,
} from "~/server/api/routers/yidework/templeGenderUtils";
import { api } from "~/utils/api";
import { validatePhoneNumber } from "~/utils/phoneValidation";

type AddQiudaorenFormData = Omit<
  inferRouterInputs<YideWorkRouter>["createQiudaoren"],
  "activityId"
>;

export default function AddQiudaorenDialogContent({
  activityId,
  defaultValues,
  onSuccess,
}: {
  activityId: number;
  defaultValues?: {
    userId: string;
    name?: string;
    gender?: "MALE" | "FEMALE";
    birthYear?: number;
    phone?: string;
    yinShi?: string;
    yinShiPhone?: string;
    baoShi?: string;
    baoShiPhone?: string;
  };
  onSuccess?: () => void;
}) {
  const isEditMode = !!defaultValues;
  const utils = api.useUtils();

  const { register, handleSubmit, watch } = useForm<AddQiudaorenFormData>({
    mode: "all",
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          gender: defaultValues.gender,
          birthYear: defaultValues.birthYear,
          phone: defaultValues.phone,
          yinShi: defaultValues.yinShi,
          yinShiPhone: defaultValues.yinShiPhone,
          baoShi: defaultValues.baoShi,
          baoShiPhone: defaultValues.baoShiPhone,
        }
      : undefined,
  });

  const gender = watch("gender");
  const birthYear = watch("birthYear");

  const templeGender = useMemo(
    () => calculateTempleGender(gender, birthYear),
    [gender, birthYear],
  );

  const {
    mutate: createQiudaoren,
    isPending: createQiudaorenIsPending,
    error: createQiudaorenError,
  } = api.yideworkActivity.createQiudaoren.useMutation({
    onSuccess: () => {
      void utils.yideworkActivity.getQiudaorenByActivity.invalidate();
      onSuccess?.();
    },
  });

  const {
    mutate: updateQiudaoren,
    isPending: updateQiudaorenIsPending,
    error: updateQiudaorenError,
  } = api.yideworkActivity.updateQiudaoren.useMutation({
    onSuccess: () => {
      void utils.yideworkActivity.getQiudaorenByActivity.invalidate();
      onSuccess?.();
    },
  });

  const isPending = createQiudaorenIsPending || updateQiudaorenIsPending;
  const error = createQiudaorenError || updateQiudaorenError;

  return (
    <form className="flex flex-col space-y-4">
      {error && <AlertWarning>{error.message}</AlertWarning>}
      <div>
        <label className="label">
          <span className="label-text">名字</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          required
          {...register("name")}
        />
      </div>

      <div>
        <label className="label">
          <span className="label-text">性別</span>
        </label>
        <div className="flex space-x-4">
          <label className="label cursor-pointer">
            <input
              type="radio"
              className="radio"
              value="MALE"
              {...register("gender", { required: true })}
            />
            <span className="label-text ml-2">男</span>
          </label>
          <label className="label cursor-pointer">
            <input
              type="radio"
              className="radio"
              value="FEMALE"
              {...register("gender", { required: true })}
            />
            <span className="label-text ml-2">女</span>
          </label>
        </div>
      </div>

      <div>
        <label className="label">
          <span className="label-text">生日（年份）</span>
        </label>
        <input
          type="number"
          className="input input-bordered w-full"
          required
          {...register("birthYear", {
            // Use setValueAs instead of valueAsNumber to prevent NaN from appearing
            // in the input field when it's empty. valueAsNumber converts empty strings
            // to NaN, which then displays as "NaN" in the input.
            setValueAs: (value) => {
              if (value === "" || value === null || value === undefined) {
                return undefined;
              }
              const num = Number(value);
              return Number.isNaN(num) ? undefined : num;
            },
            required: "生日年份為必填",
            min: {
              value: 1900,
              message: "年份必須在 1900 以後",
            },
            max: {
              value: new Date().getFullYear(),
              message: "年份不能是未來年份",
            },
            validate: (value) => {
              if (!value) return true;
              const yearStr = value.toString();
              if (!(yearStr.startsWith("19") || yearStr.startsWith("20"))) {
                return "年份必須是 19xx 或 20xx 格式";
              }
              return true;
            },
          })}
        />
        {birthYear && lodashIsFinite(birthYear) && (
          <div className="mt-2 flex flex-col gap-1 text-gray-600 text-sm">
            <div>年齡：{new Date().getFullYear() - birthYear} 歲</div>
            {templeGender && (
              <div>佛堂性別：{TEMPLE_GENDER_LABELS[templeGender]}</div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="label">
          <span className="label-text">電話</span>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="09XXXXXXXX"
          className="input input-bordered w-full"
          {...register("phone", {
            validate: (value) =>
              !value || validatePhoneNumber(value)
                ? true
                : "電話號碼必須以 09 開頭，共 10 位數字",
          })}
        />
      </div>

      <div className="divider" />

      <div>
        <label className="label">
          <span className="label-text">引師</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          {...register("yinShi")}
        />
      </div>

      <div>
        <label className="label">
          <span className="label-text">引師電話</span>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="09XXXXXXXX"
          className="input input-bordered w-full"
          {...register("yinShiPhone", {
            validate: (value) =>
              !value || validatePhoneNumber(value)
                ? true
                : "電話號碼必須以 09 開頭，共 10 位數字",
          })}
        />
      </div>

      <div className="divider" />

      <div>
        <label className="label">
          <span className="label-text">保師</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          {...register("baoShi")}
        />
      </div>

      <div>
        <label className="label">
          <span className="label-text">保師電話</span>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="09XXXXXXXX"
          className="input input-bordered w-full"
          {...register("baoShiPhone", {
            validate: (value) =>
              !value || validatePhoneNumber(value)
                ? true
                : "電話號碼必須以 09 開頭，共 10 位數字",
          })}
        />
      </div>

      <ReactiveButton
        className="btn btn-primary"
        loading={isPending}
        error={error?.message}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={handleSubmit((data) => {
          if (isEditMode && defaultValues?.userId) {
            void updateQiudaoren({
              activityId,
              userId: defaultValues.userId,
              ...data,
            });
          } else {
            void createQiudaoren({
              activityId,
              ...data,
            });
          }
        })}
      >
        {isEditMode ? "更新" : "新增"}
      </ReactiveButton>
    </form>
  );
}
