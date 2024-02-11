import EtogetherActivityForm from "~/components/Form/EtogetherActivityForm";

export default function NewClassActivityPage() {
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>建立新活動</h1>
      </article>
      <EtogetherActivityForm />
    </div>
  );
}
