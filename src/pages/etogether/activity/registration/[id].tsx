import { CheckIcon } from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/Alert";
import { api } from "~/utils/api";

export default function EtogetherRegistrationPage() {
  const router = useRouter();

  const { id } = router.query;

  const {
    data: activity,
    isLoading,
    error,
  } = api.etogetherActivity.getActivityWithRegistrations.useQuery({
    activityId: Number(id),
  });

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;

  const userBySubgroup: Record<number, { name: string; checked: boolean }[]> =
    {};
  for (const register of activity.registers) {
    if (isNil(register.user.name)) continue;

    const entry = {
      name: register.user.name,
      checked: !isNil(register.checkRecord),
    };

    if (userBySubgroup[register.subgroupId] === undefined) {
      userBySubgroup[register.subgroupId] = [entry];
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      userBySubgroup[register.subgroupId].push(entry);
    }
  }
  for (const register of activity.externalRegisters) {
    const entry = {
      name: register.username,
      checked: !isNil(register.checkRecord),
    };

    if (userBySubgroup[register.subgroupId] === undefined) {
      userBySubgroup[register.subgroupId] = [entry];
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      userBySubgroup[register.subgroupId].push(entry);
    }
  }
  console.log(userBySubgroup);

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/etogether/activity/detail/${activity.id}`}>
        ← {activity?.title}
      </Link>
      <article className="prose">
        <h1>報名名單</h1>
      </article>
      {/* <div className="flex justify-end">
        <ReactiveButton
          className="btn"
          //   onClick={() => setManualRegisterDialogOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          手動報名
        </ReactiveButton>
      </div> */}

      <table className="table table-pin-rows">
        {activity.subgroups.map((subgroup) => (
          <>
            <thead>
              <tr>
                <th>
                  {subgroup.title}（簽到：
                  {
                    userBySubgroup[subgroup.id]?.filter(
                      (entry) => entry.checked,
                    ).length
                  }{" "}
                  / 報名：{userBySubgroup[subgroup.id]?.length}）
                </th>
              </tr>
            </thead>
            <tbody>
              {userBySubgroup[subgroup.id]?.map((entry) => (
                // eslint-disable-next-line react/jsx-key
                <tr>
                  <td>{entry.name}</td>
                  <td>{entry.checked && <CheckIcon className="h-4 w-4" />}</td>
                </tr>
              ))}
            </tbody>
          </>
        ))}
      </table>
    </div>
  );
}
