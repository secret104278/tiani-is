import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import QiudaoLunarDisplay from "~/components/QiudaoLunarDisplay";
import UnitSelector from "~/components/inputs/UnitSelector";
import ReactiveButton from "~/components/utils/ReactiveButton";
import type { UserProfileFormData } from "~/utils/types";

interface Props {
  initialData?: Partial<UserProfileFormData>;
  onSubmit: (data: UserProfileFormData) => void;
  isLoading: boolean;
  isSuccess?: boolean;
  error?: string;
  showNameField?: boolean;
}

export function UserProfileForm({
  initialData,
  onSubmit,
  isLoading,
  isSuccess,
  error,
  showNameField,
}: Props) {
  const [qiudaoHour, setQiudaoHour] = useState<string>("");
  const { register, handleSubmit, watch, reset, control } =
    useForm<UserProfileFormData>({
      mode: "all",
      defaultValues: initialData,
    });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setQiudaoHour(initialData.qiudaoHour ?? "");
    }
  }, [initialData, reset]);

  const qiudaoDateSolar = watch("qiudaoDateSolar");

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((data) => onSubmit({ ...data, qiudaoHour }))}
    >
      {showNameField && (
        <div>
          <label className="label">
            <span className="label-text">姓名</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            required
            {...register("name")}
          />
        </div>
      )}

      <div>
        <label className="label">
          <span className="label-text">所屬單位</span>
        </label>
        <Controller
          control={control}
          name="affiliation"
          render={({ field }) => (
            <UnitSelector value={field.value ?? ""} onChange={field.onChange} />
          )}
        />
      </div>

      <div>
        <label className="label">
          <span className="label-text">求道日期（國曆）</span>
        </label>
        <input
          type="date"
          className="input input-bordered w-full"
          {...register("qiudaoDateSolar")}
        />
      </div>

      <QiudaoLunarDisplay
        solarDate={qiudaoDateSolar ?? ""}
        hour={qiudaoHour}
        onHourChange={setQiudaoHour}
      />

      {(
        [
          "qiudaoTemple",
          "qiudaoTanzhu",
          "dianChuanShi",
          "yinShi",
          "baoShi",
        ] as const
      ).map((field) => (
        <div key={field}>
          <label className="label">
            <span className="label-text">
              {field === "qiudaoTemple"
                ? "求道佛堂"
                : field === "qiudaoTanzhu"
                  ? "壇主（姓名）"
                  : field === "dianChuanShi"
                    ? "點傳師"
                    : field === "yinShi"
                      ? "引師"
                      : "保師"}
            </span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register(field)}
          />
        </div>
      ))}

      <div className="flex justify-end pt-4">
        <ReactiveButton
          type="submit"
          loading={isLoading}
          isSuccess={isSuccess}
          error={error}
        >
          儲存設定
        </ReactiveButton>
      </div>
    </form>
  );
}
