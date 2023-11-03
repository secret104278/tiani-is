import { isEmpty } from "lodash";
import { useSession } from "next-auth/react";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function AdminUsersPage() {
  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
    refetch: usersRefetch,
  } = api.user.getUsers.useQuery({});
  const {
    data: reviewers,
    isLoading: reviewersIsLoading,
    error: reviewersError,
    refetch: reviewersRefetch,
  } = api.user.getActivityReviewers.useQuery({});
  const reviewerUserIds = reviewers?.map((reviewer) => reviewer.userId) ?? [];

  const { mutate: setIsAdmin } = api.user.setIsAdmin.useMutation({
    onSettled: () => usersRefetch(),
  });
  const { mutate: setIsActivityReviewer } =
    api.user.setIsActivityReviewer.useMutation({
      onSettled: () => Promise.all([reviewersRefetch(), usersRefetch()]),
    });

  const { data: sessionData } = useSession();

  if (usersIsLoading || reviewersIsLoading) return <div className="loading" />;
  if (!isEmpty(usersError))
    return <AlertWarning>{usersError.message}</AlertWarning>;
  if (!isEmpty(reviewersError))
    return <AlertWarning>{reviewersError.message}</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>帳號管理</h1>
      </article>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>管理者</th>
              <th>審核者</th>
            </tr>
          </thead>
          <tbody>
            {users?.toSorted()?.map((user) => (
              <tr key={user.id} className="hover">
                <td>{user.name}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.role === "ADMIN"}
                    className="checkbox"
                    disabled={user.id === sessionData?.user.id}
                    onClick={() =>
                      setIsAdmin({
                        userId: user.id,
                        isAdmin: !(user.role === "ADMIN"),
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={reviewerUserIds.includes(user.id)}
                    className="checkbox"
                    onClick={() =>
                      setIsActivityReviewer({
                        userId: user.id,
                        isReviewer: !reviewerUserIds.includes(user.id),
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
