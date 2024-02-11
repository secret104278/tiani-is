import { BarsArrowDownIcon } from "@heroicons/react/20/solid";
import { isEmpty, isString } from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import { api } from "~/utils/api";
import { userComparator } from "~/utils/ui";

enum SortedType {
  NAME,
  IS_CLASS_MEMBER,
}

const getComparator = (sortedType: SortedType, enrolledMemberIds: string[]) => {
  type User = { name: string | null; id: string };

  switch (sortedType) {
    case SortedType.NAME:
      return userComparator;
    case SortedType.IS_CLASS_MEMBER:
      return (a: User, b: User) => {
        const result =
          Number(enrolledMemberIds.includes(b.id)) -
          Number(enrolledMemberIds.includes(a.id));
        return result !== 0 ? result : userComparator(a, b);
      };
  }
};

export default function YiDeAdminClassDetail() {
  const router = useRouter();
  const { title } = router.query;

  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
  } = api.user.getUsers.useQuery({});

  const {
    data: classMemberEnrollments,
    isLoading: classMemberEnrollmentsIsLoading,
    error: classMemberEnrollmentsError,
    refetch: classMemberEnrollmentsRefetch,
  } = api.classActivity.getClassMemberEnrollments.useQuery({
    classTitle: String(title),
  });

  const enrolledUserIds =
    classMemberEnrollments?.map((enrollment) => enrollment.userId) ?? [];

  const { mutate: enrollClass } = api.classActivity.enrollClass.useMutation({
    onSettled: () => classMemberEnrollmentsRefetch(),
  });

  const { mutate: unenrollClass } = api.classActivity.unenrollClass.useMutation(
    {
      onSettled: () => classMemberEnrollmentsRefetch(),
    },
  );

  const [sortedType, setSortedType] = useState(SortedType.NAME);

  if (!isString(title) || isEmpty(title))
    return <AlertWarning>找不到課程</AlertWarning>;
  if (usersIsLoading || classMemberEnrollmentsIsLoading)
    return <div className="loading" />;
  if (!isEmpty(classMemberEnrollmentsError))
    return <AlertWarning>{classMemberEnrollmentsError.message}</AlertWarning>;
  if (!isEmpty(usersError))
    return <AlertWarning>{usersError.message}</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <div className="link" onClick={() => router.back()}>
        ← 上一頁
      </div>
      <article className="prose">
        <h1>{title} 班員管理</h1>
      </article>
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">目前班員數</div>
          <div className="stat-value">{classMemberEnrollments?.length}</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="tiani-table-pin-col">
                <div
                  className="flex cursor-pointer"
                  onClick={() => setSortedType(SortedType.NAME)}
                >
                  姓名
                  {sortedType === SortedType.NAME && (
                    <BarsArrowDownIcon className="ml-1 w-4" />
                  )}
                </div>
              </th>
              <th>
                <div
                  className="flex cursor-pointer"
                  onClick={() => setSortedType(SortedType.IS_CLASS_MEMBER)}
                >
                  班員
                  {sortedType === SortedType.IS_CLASS_MEMBER && (
                    <BarsArrowDownIcon className="ml-1 w-4" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {users
              ?.sort(getComparator(sortedType, enrolledUserIds))
              ?.map((user) => (
                <tr key={user.id} className="hover">
                  <td className="tiani-table-pin-col">{user.name}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={enrolledUserIds.includes(user.id)}
                      className="checkbox"
                      onClick={() =>
                        enrolledUserIds.includes(user.id)
                          ? unenrollClass({
                              userId: user.id,
                              classTitle: title,
                            })
                          : enrollClass({
                              userId: user.id,
                              classTitle: title,
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
