import { useSession } from "next-auth/react";
import { UserProfileForm } from "~/components/Form/UserProfileForm";
import LineImage from "~/components/utils/LineImage";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";
import type { UserProfileFormData } from "~/utils/types";

export default function PersonalAccountPage() {
  const { data: sessionData, update: updateSession } = useSession();

  // Fetch current user profile data
  const { data: userProfile, isLoading: userProfileIsLoading } =
    api.user.getCurrentUserProfile.useQuery();

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

  const initialData: Partial<UserProfileFormData> = {
    name: userProfile?.name ?? "",
    qiudaoDateSolar: userProfile?.qiudaoDateSolar
      ? new Date(userProfile.qiudaoDateSolar).toISOString().split("T")[0]
      : "",
    qiudaoHour: userProfile?.qiudaoHour ?? "",
    qiudaoTemple: userProfile?.qiudaoTemple ?? "",
    qiudaoTanzhu: userProfile?.qiudaoTanzhu ?? "",
    affiliation: userProfile?.affiliation ?? "",
    dianChuanShi: userProfile?.dianChuanShi ?? "",
    yinShi: userProfile?.yinShi ?? "",
    baoShi: userProfile?.baoShi ?? "",
  };

  const handleFormSubmit = (data: UserProfileFormData) => {
    updateProfile(
      {
        name: data.name ?? "",
        image: lineImage ?? sessionData.user.image,
      },
      {
        onSuccess: () => {
          updateQiudaoInfo({
            qiudaoDateSolar: data.qiudaoDateSolar
              ? new Date(data.qiudaoDateSolar)
              : null,
            qiudaoHour: data.qiudaoHour || null,
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

      <div className="max-w-xs space-y-4">
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

        <div className="divider" />

        <article className="prose">
          <h2>求道卡資料</h2>
        </article>

        <UserProfileForm
          initialData={initialData}
          onSubmit={handleFormSubmit}
          isLoading={updateProfileIsPending || updateQiudaoInfoIsPending}
          isSuccess={updateProfileIsSuccess}
          error={updateProfileError?.message}
          showNameField={true}
        />
      </div>
    </div>
  );
}
