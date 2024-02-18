import {
  CheckBadgeIcon,
  CheckIcon,
  QueueListIcon,
} from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import { api } from "~/utils/api";

interface Register {
  name: string;
  subgroupId: number;
  externals: { name: string; subgroupId: number }[];
}

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

  const [dialogRegister, setDialogRegister] = useState<Register | undefined>(
    undefined,
  );

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading) return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;

  const totalRegisters =
    activity.registers.length + activity.externalRegisters.length;
  const totalCheckRecords =
    activity.registers.filter((register) => !isNil(register.checkRecord))
      .length +
    activity.externalRegisters.filter(
      (register) => !isNil(register.checkRecord),
    ).length;

  const subgroupMap: Record<number, string> = {};
  const mainRegisterMap: Record<number, Register> = {};
  const userBySubgroup: Record<
    number,
    { name: string; checked: boolean; mainRegisterId: number }[]
  > = {};

  for (const subgroup of activity.subgroups) {
    subgroupMap[subgroup.id] = subgroup.title;
  }

  for (const register of activity.registers) {
    if (isNil(register.user.name)) continue;

    const entry = {
      name: register.user.name,
      checked: !isNil(register.checkRecord),
      mainRegisterId: register.id,
    };

    if (userBySubgroup[register.subgroupId] === undefined) {
      userBySubgroup[register.subgroupId] = [entry];
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      userBySubgroup[register.subgroupId].push(entry);
    }

    mainRegisterMap[register.id] = {
      name: register.user.name,
      subgroupId: register.subgroupId,
      externals: [],
    };
  }
  for (const register of activity.externalRegisters) {
    const entry = {
      name: register.username,
      checked: !isNil(register.checkRecord),
      mainRegisterId: register.mainRegisterId,
    };

    if (userBySubgroup[register.subgroupId] === undefined) {
      userBySubgroup[register.subgroupId] = [entry];
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      userBySubgroup[register.subgroupId].push(entry);
    }

    mainRegisterMap[register.mainRegisterId]?.externals.push({
      name: register.username,
      subgroupId: register.subgroupId,
    });
  }

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/etogether/activity/detail/${activity.id}`}>
        ← {activity?.title}
      </Link>
      <article className="prose">
        <h1>報名名單</h1>
      </article>
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-secondary">
            <CheckBadgeIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">總報到人數</div>
          <div className="stat-value text-secondary">{totalCheckRecords}</div>
        </div>
        <div className="stat">
          <div className="stat-figure">
            <QueueListIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">總報名人數</div>
          <div className="stat-value">{totalRegisters}</div>
        </div>
      </div>
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
            <thead className="text-black">
              <tr
                style={
                  !isNil(subgroup.displayColorCode)
                    ? {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        backgroundColor: subgroup.displayColorCode,
                      }
                    : undefined
                }
              >
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
                <tr
                  className="hover cursor-pointer"
                  onClick={() =>
                    setDialogRegister(mainRegisterMap[entry.mainRegisterId])
                  }
                >
                  <td>{entry.name}</td>
                  <td>{entry.checked && <CheckIcon className="h-4 w-4" />}</td>
                </tr>
              ))}
            </tbody>
          </>
        ))}
      </table>
      <Dialog
        title="報名表"
        show={!isNil(dialogRegister)}
        closeModal={() => setDialogRegister(undefined)}
      >
        {!isNil(dialogRegister) && (
          <div className="space-y-2">
            <p>
              {dialogRegister.name}：{subgroupMap[dialogRegister.subgroupId]}
            </p>
            <div className="divider m-0" />
            {dialogRegister.externals.map((r) => (
              <p key={r.name}>
                {r.name}：{subgroupMap[r.subgroupId]}
              </p>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}
