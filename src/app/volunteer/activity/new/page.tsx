import VolunteerActivityForm from "../form";

export default function NewVolunteerActivityPage() {
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>建立新工作</h1>
      </article>
      <VolunteerActivityForm />
    </div>
  );
}
