import { useClose } from "@headlessui/react";
import { useForm } from "react-hook-form";
import ReactiveButton from "../utils/ReactiveButton";

import type { inferRouterInputs } from "@trpc/server";
import { isFinite as lodashIsFinite } from "lodash";
import { useMemo } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import type { WorkRouter } from "~/server/api/routers/work";
import {
  TEMPLE_GENDER_LABELS,
  calculateTempleGender,
} from "~/server/api/routers/work/templeGenderUtils";
import { api } from "~/utils/api";
import { validatePhoneNumber } from "~/utils/phoneValidation";

type AddQiudaorenFormData = Omit<
  inferRouterInputs<WorkRouter>["createQiudaoren"],
  "activityId"
>;

type AddQiudaorenDefaultValues = Partial<AddQiudaorenFormData> & {
  userId: string;
};

export default function AddQiudaorenDialogContent({
  activityId,
  defaultValues,
}: {
  activityId: number;
  defaultValues?: AddQiudaorenDefaultValues;
}) {
  const isEditMode = !!defaultValues;
  const utils = api.useUtils();

  const { register, handleSubmit, watch, formState } =
    useForm<AddQiudaorenFormData>({
      mode: "all",
      defaultValues: defaultValues
        ? {
            ...defaultValues,
            birthYear: defaultValues.birthYear
              ? defaultValues.birthYear - 1911
              : undefined,
          }
        : undefined,
    });

  const { errors } = formState;

  const gender = watch("gender");
  const birthYear = watch("birthYear");
  const adBirthYear = lodashIsFinite(birthYear) ? birthYear + 1911 : undefined;

  const templeGender = useMemo(
    () => calculateTempleGender(gender, adBirthYear),
    [gender, adBirthYear],
  );

  const close = useClose();

  const {
    mutate: createQiudaoren,
    isPending: createQiudaorenIsPending,
    error: createQiudaorenError,
  } = api.workActivity.createQiudaoren.useMutation({
    onSuccess: () => {
      void utils.workActivity.getQiudaorensByActivity.invalidate();
      void utils.workActivity.getQiudaorensByActivityAndCreatedBy.invalidate();
      close();
    },
  });

  const {
    mutate: updateQiudaoren,
    isPending: updateQiudaorenIsPending,
    error: updateQiudaorenError,
  } = api.workActivity.updateQiudaoren.useMutation({
    onSuccess: () => {
      void utils.workActivity.getQiudaorensByActivity.invalidate();
      void utils.workActivity.getQiudaorensByActivityAndCreatedBy.invalidate();
      close();
    },
  });

  const isPending = createQiudaorenIsPending || updateQiudaorenIsPending;
  const error = createQiudaorenError || updateQiudaorenError;

  const handleFormSubmit = handleSubmit((data) => {
    if (isEditMode && defaultValues?.userId) {
      void updateQiudaoren({
        activityId,
        userId: defaultValues.userId,
        ...data,
        birthYear: data.birthYear + 1911,
      });
    } else {
      void createQiudaoren({
        activityId,
        ...data,
        birthYear: data.birthYear + 1911,
      });
    }
  });

  return (
    <form className="flex flex-col space-y-4" onSubmit={handleFormSubmit}>
      {error && <AlertWarning>{error.message}</AlertWarning>}
      <div>
        <label className="label">
          <span className="label-text">名字</span>
        </label>
        <input
          type="text"
          className={`input input-bordered w-full ${
            errors.name ? "input-error" : ""
          }`}
          required
          {...register("name", { required: "名字為必填" })}
        />
        {errors.name && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.name.message}
            </span>
          </label>
        )}
      </div>

      <fieldset>
        <legend className="label">
          <span className="label-text">性別</span>
        </legend>
        <div className="flex space-x-4">
          <label className="label cursor-pointer">
            <input
              type="radio"
              className="radio"
              value="MALE"
              {...register("gender", { required: "性別為必填" })}
            />
            <span className="label-text ml-2">乾</span>
          </label>
          <label className="label cursor-pointer">
            <input
              type="radio"
              className="radio"
              value="FEMALE"
              {...register("gender", { required: "性別為必填" })}
            />
            <span className="label-text ml-2">坤</span>
          </label>
        </div>
        {errors.gender && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.gender.message}
            </span>
          </label>
        )}
      </fieldset>

      <div>
        <label className="label">
          <span className="label-text">生日（民國年份）</span>
        </label>
        <input
          type="number"
          inputMode="numeric"
          step="1"
          min={-11}
          max={new Date().getFullYear() - 1911}
          className={`input input-bordered w-full ${
            errors.birthYear ? "input-error" : ""
          }`}
          required
          {...register("birthYear", {
            // Use setValueAs instead of valueAsNumber to prevent NaN from appearing
            // in the input field when it's empty. valueAsNumber converts empty strings
            // to NaN, which then displays as "NaN" in the input.
            setValueAs: (value) => {
              if (value === "" || value === null || value === undefined) {
                return undefined;
              }
              const adYear = Number(value);
              if (Number.isNaN(adYear)) {
                return undefined;
              }
              return adYear;
            },
            required: "生日民國年份為必填",
            min: {
              value: -11,
              message: "民國年份必須在民國前 11 年以後",
            },
            max: {
              value: new Date().getFullYear() - 1911,
              message: "民國年份不能是未來年份",
            },
            validate: (value) => {
              if (!value) return true;
              if (value < -11 || value > new Date().getFullYear() - 1911) {
                return "民國年份超出有效範圍";
              }
              return true;
            },
          })}
        />
        {errors.birthYear && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.birthYear.message}
            </span>
          </label>
        )}
        {adBirthYear && lodashIsFinite(adBirthYear) && !errors.birthYear && (
          <div className="mt-2 flex flex-col gap-1 text-gray-600 text-sm">
            <div>年齡：{new Date().getFullYear() - adBirthYear} 歲</div>
            {templeGender && (
              <div>求道性別：{TEMPLE_GENDER_LABELS[templeGender]}</div>
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
          className={`input input-bordered w-full ${
            errors.phone ? "input-error" : ""
          }`}
          {...register("phone", {
            validate: (value) =>
              !value || validatePhoneNumber(value)
                ? true
                : "電話號碼必須以 09 開頭，共 10 位數字",
          })}
        />
        {errors.phone && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.phone.message}
            </span>
          </label>
        )}
      </div>

      <div className="divider" />

      <div>
        <label className="label">
          <span className="label-text">引師</span>
        </label>
        <input
          type="text"
          className={`input input-bordered w-full ${
            errors.yinShi ? "input-error" : ""
          }`}
          required
          {...register("yinShi", { required: "引師為必填" })}
        />
        {errors.yinShi && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.yinShi.message}
            </span>
          </label>
        )}
      </div>

      <fieldset>
        <legend className="label">
          <span className="label-text">引師性別</span>
        </legend>
        <div className="flex space-x-4">
          <label className="label cursor-pointer">
            <input
              type="radio"
              className="radio"
              value="MALE"
              {...register("yinShiGender", { required: "引師性別為必填" })}
            />
            <span className="label-text ml-2">乾</span>
          </label>
          <label className="label cursor-pointer">
            <input
              type="radio"
              className="radio"
              value="FEMALE"
              {...register("yinShiGender", { required: "引師性別為必填" })}
            />
            <span className="label-text ml-2">坤</span>
          </label>
        </div>
        {errors.yinShiGender && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.yinShiGender.message}
            </span>
          </label>
        )}
      </fieldset>

      <div>
        <label className="label">
          <span className="label-text">引師電話</span>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="09XXXXXXXX"
          className={`input input-bordered w-full ${
            errors.yinShiPhone ? "input-error" : ""
          }`}
          {...register("yinShiPhone", {
            validate: (value) =>
              !value || validatePhoneNumber(value)
                ? true
                : "電話號碼必須以 09 開頭，共 10 位數字",
          })}
        />
        {errors.yinShiPhone && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.yinShiPhone.message}
            </span>
          </label>
        )}
      </div>

      <div className="divider" />

      <div>
        <label className="label">
          <span className="label-text">保師</span>
        </label>
        <input
          type="text"
          className={`input input-bordered w-full ${
            errors.baoShi ? "input-error" : ""
          }`}
          required
          {...register("baoShi", { required: "保師為必填" })}
        />
        {errors.baoShi && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.baoShi.message}
            </span>
          </label>
        )}
      </div>

      <fieldset>
        <legend className="label">
          <span className="label-text">保師性別</span>
        </legend>
        <div className="flex space-x-4">
          <label className="label cursor-pointer">
            <input
              type="radio"
              className="radio"
              value="MALE"
              {...register("baoShiGender", { required: "保師性別為必填" })}
            />
            <span className="label-text ml-2">乾</span>
          </label>
          <label className="label cursor-pointer">
            <input
              type="radio"
              className="radio"
              value="FEMALE"
              {...register("baoShiGender", { required: "保師性別為必填" })}
            />
            <span className="label-text ml-2">坤</span>
          </label>
        </div>
        {errors.baoShiGender && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.baoShiGender.message}
            </span>
          </label>
        )}
      </fieldset>

      <div>
        <label className="label">
          <span className="label-text">保師電話</span>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="09XXXXXXXX"
          className={`input input-bordered w-full ${
            errors.baoShiPhone ? "input-error" : ""
          }`}
          {...register("baoShiPhone", {
            validate: (value) =>
              !value || validatePhoneNumber(value)
                ? true
                : "電話號碼必須以 09 開頭，共 10 位數字",
          })}
        />
        {errors.baoShiPhone && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.baoShiPhone.message}
            </span>
          </label>
        )}
      </div>

      <ReactiveButton
        type="submit"
        className="btn btn-primary"
        loading={isPending}
        error={error?.message}
      >
        {isEditMode ? "更新" : "新增"}
      </ReactiveButton>
    </form>
  );
}
