import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { api } from "~/utils/api";

export default function NewVolunteerActivityPage() {
  const { register, handleSubmit } = useForm();
  const { mutate, error, isLoading } =
    api.volunteerActivity.createActivity.useMutation();

  const router = useRouter();

  const getCurrentDateTime = (offset = 0) => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset();
    const offsetMs = (-tzOffset + offset) * 60 * 1000;
    const localTime = new Date(now.getTime() + offsetMs);
    return localTime.toISOString().slice(0, 16);
  };

  return (
    <>
      <h1>建立新活動</h1>
      <form
        className="form-control max-w-xs"
        onSubmit={handleSubmit((data) =>
          mutate({
            title: data.title,
            headcount: data.headcount,
            location: data.location,
            startDateTime: data.startDateTime,
            endDateTime: data.endDateTime,
            description: data.description,
          }),
        )}
      >
        <div>
          <label className="label">
            <span className="label-text">主題</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full invalid:input-error"
            required
            {...register("title")}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">人數</span>
          </label>
          <input
            type="number"
            className="input input-bordered w-full invalid:input-error"
            required
            {...register("headcount", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">地點</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full invalid:input-error"
            required
            {...register("location")}
          />
        </div>
        <div className="divider"></div>
        <div>
          <label className="label">
            <span className="label-text">開始時間</span>
          </label>
          <input
            type="datetime-local"
            className="input input-bordered w-full invalid:input-error"
            defaultValue={getCurrentDateTime()}
            required
            {...register("startDateTime", { valueAsDate: true })}
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">預估結束時間</span>
          </label>
          <input
            type="datetime-local"
            className="input input-bordered w-full invalid:input-error"
            defaultValue={getCurrentDateTime(60)}
            required
            {...register("endDateTime", { valueAsDate: true })}
          />
        </div>
        <div className="divider"></div>
        <div>
          <label className="label">
            <span className="label-text">補充說明</span>
          </label>
          <textarea
            className="textarea textarea-bordered textarea-lg w-full"
            {...register("description")}
          ></textarea>
        </div>
        <div className="divider"></div>
        <input type="submit" className="btn btn-primary" value="送出"></input>
      </form>
    </>
  );
}
