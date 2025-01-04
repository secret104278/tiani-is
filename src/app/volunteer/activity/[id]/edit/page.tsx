"use client";

import { useParams } from "next/navigation";
import AlertWarning from "~/app/_components/basic/alert-warning";
import { api } from "~/trpc/react";
import VolunteerActivityForm from "../../form";

export default function EditVolunteerActivityPage() {
  const { id } = useParams();

  const { data, isLoading, error } = api.volunteerActivity.getActivity.useQuery(
    {
      id: Number(id),
    },
  );

  const { activity } = data ?? {};

  if (error) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading) return <div className="loading"></div>;
  if (!activity) return <AlertWarning>找不到工作</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>{activity.title}</h1>
      </article>

      <VolunteerActivityForm defaultActivity={activity} />
    </div>
  );
}
