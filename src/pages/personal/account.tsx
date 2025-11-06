import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import LineImage from "~/components/utils/LineImage";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";

type QiudaoInfoForm = {
  qiudaoDateSolar: string;
  qiudaoDateLunar: string;
  qiudaoTemple: string;
  qiudaoTanzhu: string;
  affiliation: string;
  dianChuanShi: string;
  yinShi: string;
  baoShi: string;
};

export default function PersonalAccountPage() {
  const { data: sessionData, update: updateSession } = useSession();

  const { register, handleSubmit } = useForm<{ name: string }>({
    mode: "all",
  });

  const { register: registerQiudao, handleSubmit: handleSubmitQiudao } = useForm<QiudaoInfoForm>({
    mode: "all",
  });

  const {
    mutate: updateUserProfile,
    isPending: updateUserProfileIsPending,
    isSuccess: updateUserProfileIsSuccess,
    error: updateUserProfileError,
  } = api.user.updateUserProfile.useMutation({
    onSuccess: () => updateSession(),
  });

  const {
    data: lineImage,
    isFetching: getLineImageIsFetching,
    refetch: getLineImage,
  } = api.user.getLineImage.useQuery(undefined, {
    enabled: false,
  });

  const {
    mutate: updateQiudaoInfo,
    isPending: updateQiudaoInfoIsPending,
    isSuccess: updateQiudaoInfoIsSuccess,
    error: updateQiudaoInfoError,
  } = api.user.updateQiudaoInfo.useMutation({
    onSuccess: () => updateSession(),
  });

  if (!sessionData) {
    return <span className="loading loading-ring loading-md" />;
  }

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
            defaultValue={sessionData.user.name ?? ""}
            {...register("name")}
          />
        </div>
        <ReactiveButton
          className="btn btn-primary"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleSubmit((data) =>
            updateUserProfile({
              name: data.name,
              image: lineImage ?? sessionData.user.image,
            }),
          )}
          loading={updateUserProfileIsPending}
          isSuccess={updateUserProfileIsSuccess}
          error={updateUserProfileError?.message}
        >
          送出
        </ReactiveButton>
      </form>

      <div className="divider"></div>

      <article className="prose">
        <h2>求道卡資料</h2>
      </article>
      <form
        className="form-control max-w-xs space-y-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <label className="label">
            <span className="label-text">求道日期（國曆）</span>
          </label>
          <input
            type="date"
            className="input input-bordered w-full"
            {...registerQiudao("qiudaoDateSolar")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">求道日期（農曆）</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="例：農曆正月初一"
            {...registerQiudao("qiudaoDateLunar")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">求道佛堂</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...registerQiudao("qiudaoTemple")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">壇主（姓名）</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...registerQiudao("qiudaoTanzhu")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">所屬單位</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...registerQiudao("affiliation")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">點傳師</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...registerQiudao("dianChuanShi")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">引師</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...registerQiudao("yinShi")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">保師</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            {...registerQiudao("baoShi")}
          />
        </div>
        <ReactiveButton
          className="btn btn-primary"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleSubmitQiudao((data) =>
            updateQiudaoInfo({
              qiudaoDateSolar: data.qiudaoDateSolar ? new Date(data.qiudaoDateSolar) : null,
              qiudaoDateLunar: data.qiudaoDateLunar || null,
              qiudaoTemple: data.qiudaoTemple || null,
              qiudaoTanzhu: data.qiudaoTanzhu || null,
              affiliation: data.affiliation || null,
              dianChuanShi: data.dianChuanShi || null,
              yinShi: data.yinShi || null,
              baoShi: data.baoShi || null,
            }),
          )}
          loading={updateQiudaoInfoIsPending}
          isSuccess={updateQiudaoInfoIsSuccess}
          error={updateQiudaoInfoError?.message}
        >
          儲存求道卡資料
        </ReactiveButton>
      </form>
    </div>
  );
}
