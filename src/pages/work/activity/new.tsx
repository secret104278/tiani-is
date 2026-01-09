import YideWorkActivityForm from "~/components/Form/YideWorkActivityForm";

export default function NewYideWorkActivityPage() {
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>建立新通知</h1>
      </article>
      <YideWorkActivityForm />
    </div>
  );
}
