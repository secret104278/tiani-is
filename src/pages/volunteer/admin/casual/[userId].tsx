import { isEmpty, isNil } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function AdminCasualUserEdit() {
  const router = useRouter();
  const { userId } = router.query;

  const {
    data: user,
    isLoading: userIsLoading,
    error: userError,
  } = api.user.getUser.useQuery({ userId: String(userId) });

  const {
    data: casualCheckHistories,
    isLoading: casualCheckHistoriesIsLoading,
    error: casualCheckHistoriesError,
  } = api.volunteerActivity.getCasualCheckHistories.useQuery({
    userId: String(userId),
  });

  if (casualCheckHistoriesIsLoading || userIsLoading)
    return <div className="loading" />;
  if (!isEmpty(casualCheckHistoriesError))
    return <AlertWarning>{casualCheckHistoriesError.message}</AlertWarning>;
  if (!isEmpty(userError))
    return <AlertWarning>{userError.message}</AlertWarning>;
  if (isNil(user)) return <AlertWarning>查無此人</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href="/volunteer/admin/casual">
        ← 日常工作管理
      </Link>
      <article className="prose">
        <h1>{user.name}</h1>
      </article>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>日期</th>
              <th>簽到</th>
              <th>簽退</th>
              <th>補正</th>
            </tr>
          </thead>
          <tbody>
            {casualCheckHistories?.map((history) => (
              <tr className="hover" key={history.id}>
                <td>{history.checkInAt.toLocaleDateString()}</td>
                <td>{history.checkInAt.toLocaleTimeString()}</td>
                <td>{history.checkOutAt?.toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
