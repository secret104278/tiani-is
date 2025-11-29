import {
  CheckBadgeIcon,
  PencilSquareIcon,
  PlusIcon,
  QueueListIcon,
} from "@heroicons/react/20/solid";
import type { inferRouterOutputs } from "@trpc/server";
import _ from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import ManualEtogetherCheckInDialogContent from "~/components/DialogContent/CheckIn/ManualEtogetherCheckInDialogContent";
import EtogetherActivityRegisterDialogContent from "~/components/DialogContent/EtogetherActivityRegisterDialogContent";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import type { EtogetherRouter } from "~/server/api/routers/etogether";
import { api } from "~/utils/api";
import { truncateTitle } from "~/utils/ui";

type Register =
  inferRouterOutputs<EtogetherRouter>["getActivityWithRegistrations"]["registers"][0];

export default function EtogetherRegistrationPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const { id } = router.query;

  const {
    data: activity,
    isLoading,
    error,
    refetch: refetchActivity,
  } = api.etogetherActivity.getActivityWithRegistrations.useQuery({
    activityId: Number(id),
  });
  const {
    mutate: checkInActivityIndividually,
    error: checkInActivityIndividuallyError,
  } = api.etogetherActivity.checkInActivityIndividually.useMutation({
    onSuccess: () => refetchActivity(),
  });

  const [dialogProps, setDialogProps] = useState<
    { register: Register; mode: "view" | "edit" } | undefined
  >(undefined);

  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);

  if (!_.isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading) return <div className="loading" />;
  if (_.isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;
  if (!_.isNil(checkInActivityIndividuallyError))
    return (
      <AlertWarning>{checkInActivityIndividuallyError.message}</AlertWarning>
    );
  if (sessionStatus === "loading") return <div className="loading" />;
  if (_.isNil(session) || !session.user.role.is_etogether_admin)
    return <AlertWarning>沒有權限</AlertWarning>;

  const totalRegisters =
    activity.registers.length +
    _.chain(activity.registers)
      .flatMap((r) => r.externalRegisters)
      .size()
      .value();

  const totalCheckRecords =
    _.chain(activity.registers)
      .filter((r) => !_.isNil(r.checkRecord))
      .size()
      .value() +
    _.chain(activity.registers)
      .flatMap((r) => r.externalRegisters)
      .filter((r) => !_.isNil(r.checkRecord))
      .size()
      .value();

  const subgroupIdToTitle: Record<number, string> = {};
  const mainRegisterMap: Record<number, Register> = {};
  const userBySubgroup: Record<
    number,
    {
      name: string;
      checked: boolean;
      mainRegisterId: number;
      registerId: number;
      isExternal: boolean;
    }[]
  > = {};

  for (const subgroup of activity.subgroups) {
    subgroupIdToTitle[subgroup.id] = subgroup.title;
  }

  for (const register of activity.registers) {
    if (_.isNil(register.user.name)) continue;

    const entry = {
      name: register.user.name,
      checked: !_.isNil(register.checkRecord),
      mainRegisterId: register.id,
      registerId: register.id,
      isExternal: false,
    };

    if (userBySubgroup[register.subgroupId] === undefined) {
      userBySubgroup[register.subgroupId] = [entry];
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      userBySubgroup[register.subgroupId].push(entry);
    }

    mainRegisterMap[register.id] = register;
  }
  for (const register of activity.registers.flatMap(
    (r) => r.externalRegisters,
  )) {
    const entry = {
      name: register.username,
      checked: !_.isNil(register.checkRecord),
      mainRegisterId: register.mainRegisterId,
      registerId: register.id,
      isExternal: true,
    };

    if (userBySubgroup[register.subgroupId] === undefined) {
      userBySubgroup[register.subgroupId] = [entry];
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      userBySubgroup[register.subgroupId].push(entry);
    }
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
      <div className="flex justify-end">
        <ReactiveButton
          className="btn"
          onClick={() => setCheckInDialogOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          手動打卡
        </ReactiveButton>
        <Dialog
          title="手動打卡"
          show={checkInDialogOpen}
          closeModal={() => setCheckInDialogOpen(false)}
        >
          <ManualEtogetherCheckInDialogContent
            activityId={activity.id}
            subgroups={activity.subgroups}
          />
        </Dialog>
      </div>
      <Dialog
        title="報名表"
        show={!_.isNil(dialogProps) && dialogProps.mode === "view"}
        closeModal={() => setDialogProps(undefined)}
      >
        {!_.isNil(dialogProps) && (
          <div className="space-y-2">
            <p>
              {dialogProps.register.user.name}：
              {subgroupIdToTitle[dialogProps.register.subgroupId]}
            </p>
            <div className="divider m-0" />
            {dialogProps.register.externalRegisters.map((r) => (
              <p key={r.username}>
                {r.username}：{subgroupIdToTitle[r.subgroupId]}
              </p>
            ))}
          </div>
        )}
      </Dialog>
      <Dialog
        title="修改報名表"
        show={!_.isNil(dialogProps) && dialogProps.mode === "edit"}
        closeModal={() => setDialogProps(undefined)}
      >
        {!_.isNil(dialogProps) && (
          <EtogetherActivityRegisterDialogContent
            user={dialogProps.register.user}
            activityId={activity.id}
            subgroups={activity.subgroups}
            defaultValues={dialogProps.register}
          />
        )}
      </Dialog>
      <div className="overflow-auto">
        <table className="table-sm table">
          {activity.subgroups.map((subgroup) => (
            <Fragment key={subgroup.id}>
              <thead className="text-black">
                <tr
                  style={
                    !_.isNil(subgroup.displayColorCode)
                      ? {
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                          backgroundColor: subgroup.displayColorCode,
                        }
                      : undefined
                  }
                >
                  <th>
                    {truncateTitle(subgroup.title)}
                    <br />
                    簽到：
                    {
                      userBySubgroup[subgroup.id]?.filter(
                        (entry) => entry.checked,
                      ).length
                    }{" "}
                    / 報名：{userBySubgroup[subgroup.id]?.length}
                  </th>
                  <th>簽到</th>
                  <th>補正</th>
                </tr>
              </thead>
              <tbody>
                {userBySubgroup[subgroup.id]?.map((entry) => (
                  <tr key={`${entry.isExternal}-${entry.registerId}`}>
                    <td
                      className="hover cursor-pointer"
                      onClick={() => {
                        const register = mainRegisterMap[entry.mainRegisterId];
                        register &&
                          setDialogProps({
                            register: register,
                            mode: "view",
                          });
                      }}
                    >
                      {entry.name}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={entry.checked}
                        className="checkbox"
                        onClick={() =>
                          checkInActivityIndividually({
                            activityId: activity.id,
                            registerId: entry.registerId,
                            isExternal: entry.isExternal,
                            checked: !entry.checked,
                          })
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          const register =
                            mainRegisterMap[entry.mainRegisterId];
                          register &&
                            setDialogProps({
                              register: register,
                              mode: "edit",
                            });
                        }}
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Fragment>
          ))}
        </table>
      </div>
    </div>
  );
}
