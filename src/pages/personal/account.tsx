import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import lunisolar from "lunisolar";
import LineImage from "~/components/utils/LineImage";
import ReactiveButton from "~/components/utils/ReactiveButton";
import QiudaoLunarDisplay from "~/components/QiudaoLunarDisplay";
import { api } from "~/utils/api";

type ProfileForm = {
  name: string;
  qiudaoDateSolar: string;
  qiudaoHour: string;
  qiudaoTemple: string;
  qiudaoTanzhu: string;
  affiliation: string;
  dianChuanShi: string;
  yinShi: string;
  baoShi: string;
};

export default function PersonalAccountPage() {
  const { data: sessionData, update: updateSession } = useSession();
  const [qiudaoHour, setQiudaoHour] = useState<string>("");
  const [lunarDate, setLunarDate] = useState<string>("");

  const { register, handleSubmit, watch, reset } = useForm<ProfileForm>({
    mode: "all",
  });

  // Fetch current user profile data
  const {
    data: userProfile,
    isLoading: userProfileIsLoading,
  } = api.user.getCurrentUserProfile.useQuery();

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

  const {
    mutate: updateQiudaoInfo,
    isPending: updateQiudaoInfoIsPending,
  } = api.user.updateQiudaoInfo.useMutation();

  if (!sessionData || userProfileIsLoading) {
    return <span className="loading loading-ring loading-md" />;
  }

  const handleFormSubmit = handleSubmit((data) => {
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
  });

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>個人資料</h1>
      </article>
      <form
        className="form-control max-w-xs space-y-4"
        onSubmit={(e) => e.preventDefault()}
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
            <ReactiveButton
              className="btn bg-[#00C300] text-[#fff] hover:bg-[#00C300]"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={() => getLineImage()}
              loading={getLineImageIsFetching}
            >
              從 Line 同步
            </ReactiveButton>
          </div>
        </div>
        <div>
          <label className="label">
            <span className="label-text">姓名（APP 裡顯示的名字）</span>
          </label>
          <input
            type="text"
            className="input input-bordered invalid:input-error w-full"
            required
            {...register("name")}
          />
        </div>

        <div className="divider"></div>

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
          className="btn btn-primary"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleFormSubmit}
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
