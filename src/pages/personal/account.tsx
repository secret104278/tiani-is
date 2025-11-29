import { zodResolver } from "@hookform/resolvers/zod";
import lunisolar from "lunisolar";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import QiudaoLunarDisplay from "~/components/QiudaoLunarDisplay";
import LineImage from "~/components/utils/LineImage";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { type UserProfileFormData, userProfileFormSchema } from "~/lib/schemas";
import { api } from "~/utils/api";

export default function PersonalAccountPage() {
  const { data: sessionData, update: updateSession } = useSession();
  const [qiudaoHour, setQiudaoHour] = useState<string>("");
  const [lunarDate, setLunarDate] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileFormSchema),
    mode: "onBlur", // Better UX - only validate after user leaves field
  });

  // Fetch current user profile data
  const { data: userProfile, isLoading: userProfileIsLoading } =
    api.user.getCurrentUserProfile.useQuery();

  // Set form default values when user profile is loaded
  useEffect(() => {
    if (userProfile && !userProfileIsLoading) {
      reset({
        name: userProfile.name ?? "",
        qiudaoDateSolar: userProfile.qiudaoDateSolar
          ? new Date(userProfile.qiudaoDateSolar).toISOString().split("T")[0]
          : "",
        qiudaoHour: userProfile.qiudaoHour ?? "",
        qiudaoTemple: userProfile.qiudaoTemple ?? "",
        qiudaoTanzhu: userProfile.qiudaoTanzhu ?? "",
        affiliation: userProfile.affiliation ?? "",
        dianChuanShi: userProfile.dianChuanShi ?? "",
        yinShi: userProfile.yinShi ?? "",
        baoShi: userProfile.baoShi ?? "",
      });
      setQiudaoHour(userProfile.qiudaoHour ?? "");
    }
  }, [userProfile, userProfileIsLoading, reset]);

  // Watch for solar date changes and auto-calculate lunar date
  const qiudaoDateSolar = watch("qiudaoDateSolar");

  // Auto-calculate lunar date when solar date changes
  useEffect(() => {
    if (qiudaoDateSolar) {
      try {
        const lunar = lunisolar(qiudaoDateSolar);
        const lunarStr = `${lunar.format("cY年lMMMM lD")}`;
        setLunarDate(lunarStr);
      } catch (e) {
        setLunarDate("");
      }
    } else {
      setLunarDate("");
    }
  }, [qiudaoDateSolar]);

  const {
    data: lineImage,
    isFetching: getLineImageIsFetching,
    refetch: getLineImage,
  } = api.user.getLineImage.useQuery(undefined, {
    enabled: false,
  });

  const {
    mutate: updateProfile,
    isPending: updateProfileIsPending,
    isSuccess: updateProfileIsSuccess,
    error: updateProfileError,
  } = api.user.updateUserProfile.useMutation({
    onSuccess: () => {
      void updateSession();
    },
  });

  const { mutate: updateQiudaoInfo, isPending: updateQiudaoInfoIsPending } =
    api.user.updateQiudaoInfo.useMutation();

  if (!sessionData || userProfileIsLoading) {
    return <span className="loading loading-ring loading-md" />;
  }

  const onSubmit = (data: UserProfileFormData) => {
    // Update profile and image first
    updateProfile(
      {
        name: data.name,
        image: lineImage ?? sessionData.user.image,
      },
      {
        onSuccess: () => {
          // Then update qiudao info
          updateQiudaoInfo({
            qiudaoDateSolar: data.qiudaoDateSolar
              ? new Date(data.qiudaoDateSolar)
              : null,
            qiudaoDateLunar: lunarDate || null,
            qiudaoHour: qiudaoHour || null,
            qiudaoTemple: data.qiudaoTemple || null,
            qiudaoTanzhu: data.qiudaoTanzhu || null,
            affiliation: data.affiliation || null,
            dianChuanShi: data.dianChuanShi || null,
            yinShi: data.yinShi || null,
            baoShi: data.baoShi || null,
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>個人資料</h1>
      </article>
      <form
        className="form-control max-w-xs space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <label className="label">
            <span className="label-text">大頭照</span>
          </label>
          <div className="flex flex-row items-center space-x-4">
            <div className="avatar">
              <div className="w-24 rounded-full">
                <LineImage
                  src={lineImage ?? sessionData.user.image ?? ""}
                  alt="user image"
                  unoptimized
                />
              </div>
            </div>
            <button
              type="button"
              className="btn bg-[#00C300] text-[#fff] hover:bg-[#00C300]"
              onClick={() => {
                void getLineImage();
              }}
              disabled={getLineImageIsFetching}
            >
              {getLineImageIsFetching && (
                <span className="loading loading-spinner loading-sm" />
              )}
              從 Line 同步
            </button>
          </div>
        </div>
        <div>
          <label className="label">
            <span className="label-text">
              姓名（APP 裡顯示的名字）
              <span className="ml-1 text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            className="input input-bordered invalid:input-error w-full"
            {...register("name")}
          />
          {errors.name && (
            <label className="label">
              <span className="label-text-alt text-error">
                {errors.name.message}
              </span>
            </label>
          )}
        </div>

        <div className="divider" />

        <article className="prose">
          <h2>求道卡資料</h2>
        </article>

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
          solarDate={qiudaoDateSolar}
          hour={qiudaoHour}
          onHourChange={setQiudaoHour}
        />
        <div>
          <label className="label">
            <span className="label-text">求道佛堂</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("qiudaoTemple")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">壇主（姓名）</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("qiudaoTanzhu")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">所屬單位</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("affiliation")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">點傳師</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("dianChuanShi")}
          />
        </div>
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
            <span className="label-text">保師</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...register("baoShi")}
          />
        </div>
        <ReactiveButton
          type="submit"
          className="btn btn-primary"
          loading={updateProfileIsPending || updateQiudaoInfoIsPending}
          isSuccess={updateProfileIsSuccess}
          error={updateProfileError?.message}
        >
          儲存
        </ReactiveButton>
      </form>
    </div>
  );
}
