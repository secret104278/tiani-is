import { useRouter } from "next/router";
import { CLASS_ACTIVITY_TITLES } from "~/utils/ui";

export default function YiDeAdminClassList() {
  const router = useRouter();

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>課程管理</h1>
      </article>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>班別</th>
            </tr>
          </thead>
          <tbody>
            {CLASS_ACTIVITY_TITLES.map((title, idx) => (
              <tr
                key={idx}
                className="hover hover:cursor-pointer"
                onClick={() =>
                  void router.push(
                    `/class/admin/class/${encodeURIComponent(title)}`,
                  )
                }
              >
                <td>{title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
