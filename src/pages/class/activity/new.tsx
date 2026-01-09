import ClassActivityForm from "~/components/Form/ClassActivityForm";

export default function NewClassActivityPage() {
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>建立新簽到單</h1>
      </article>
      <ClassActivityForm />
    </div>
  );
}
