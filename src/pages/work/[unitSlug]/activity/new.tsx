import { useRouter } from "next/router";
import WorkActivityForm from "~/components/Form/WorkActivityForm";

export default function NewWorkActivityPage() {
  const router = useRouter();
  const { unitSlug } = router.query;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>建立新通知</h1>
      </article>
      <WorkActivityForm unitSlug={unitSlug as string} />
    </div>
  );
}
