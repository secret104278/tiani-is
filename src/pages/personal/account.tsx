import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import LineImage from "~/components/utils/LineImage";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { api } from "~/utils/api";

export default function PersonalAccountPage() {
  const { data: sessionData, update: updateSession } = useSession();

  const { register, handleSubmit } = useForm<{ name: string }>({
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
    </div>
  );
}
