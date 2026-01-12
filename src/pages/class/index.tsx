import Link from "next/link";
import { UNITS } from "~/utils/ui";

export default function ClassManagementHome() {
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>班務網</h1>
        <p>請選擇您的單位</p>
      </article>

      <div className="grid grid-cols-2 gap-4">
        {UNITS.map((unit) => (
          <Link href={`/class/${unit.slug}`} key={unit.slug}>
            <div className="card cursor-pointer bg-accent shadow transition-colors hover:bg-base-200">
              <div className="card-body items-center text-center">
                <h2 className="card-title text-2xl">{unit.name}</h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
