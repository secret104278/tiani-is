import {
  PencilSquareIcon,
  PlusIcon,
  QueueListIcon,
} from "@heroicons/react/20/solid";

import type { inferRouterOutputs } from "@trpc/server";
import _ from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import ManualYideWorkCheckInDialogContent from "~/components/DialogContent/CheckIn/ManualYideWorkCheckInDialogContent";
import YideWorkActivityRegisterDialogContent from "~/components/DialogContent/YideWorkActivityRegisterDialogContent";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import ReactiveButton from "~/components/utils/ReactiveButton";
import { type YideWorkRouter } from "~/server/api/routers/yidework";
import { api } from "~/utils/api";

type Register =
  inferRouterOutputs<YideWorkRouter>["getActivityWithRegistrations"]["registers"][0];

export default function YideWorkActivityRegistrationPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const { id } = router.query;

  const {
    data: activity,
    isLoading,
    error,
  } = api.yideworkActivity.getActivityWithRegistrations.useQuery({
    activityId: Number(id),
  });

  const [dialogProps, setDialogProps] = useState<
    { register: Register; mode: "view" | "edit" } | undefined
  >(undefined);

  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);

  if (!_.isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading) return <div className="loading"></div>;
  if (_.isNil(activity)) return <AlertWarning>找不到工作</AlertWarning>;
  if (sessionStatus === "loading") return <div className="loading"></div>;
  if (_.isNil(session) || !session.user.role.is_yidework_admin)
    return <AlertWarning>沒有權限</AlertWarning>;

  const totalRegisters =
    activity.registers.length +
    _.chain(activity.registers)
      .flatMap((r) => r.externalRegisters)
      .size()
      .value();

  const mainRegisterMap: Record<number, Register> = {};
  const registeredUsers: {
    name: string;
    mainRegisterId: number;
    registerId: number;
    isExternal: boolean;
  }[] = [];

  for (const register of activity.registers) {
    if (_.isNil(register.user.name)) continue;

    registeredUsers.push({
      name: register.user.name,
      mainRegisterId: register.id,
      registerId: register.id,
      isExternal: false,
    });

    mainRegisterMap[register.id] = register;
  }
  for (const register of activity.registers.flatMap(
    (r) => r.externalRegisters,
  )) {
    registeredUsers.push({
      name: register.username,
      mainRegisterId: register.mainRegisterId,
      registerId: register.id,
      isExternal: true,
    });
  }

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/yidework/activity/detail/${activity.id}`}>
        ← {activity?.title}
      </Link>
      <article className="prose">
        <h1>報名名單</h1>
      </article>
      <div className="stats shadow">
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
          <ManualYideWorkCheckInDialogContent activityId={activity.id} />
        </Dialog>
      </div>
      <Dialog
        title="報名表"
        show={!_.isNil(dialogProps) && dialogProps.mode === "view"}
        closeModal={() => setDialogProps(undefined)}
      >
        {!_.isNil(dialogProps) && (
          <div className="space-y-2">
            <p>{dialogProps.register.user.name}</p>
            <div className="divider m-0" />
            {dialogProps.register.externalRegisters.map((r) => (
              <p key={r.username}>{r.username}</p>
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
          <YideWorkActivityRegisterDialogContent
            user={dialogProps.register.user}
            activityId={activity.id}
            defaultValues={dialogProps.register}
          />
        )}
      </Dialog>
      <div className="overflow-auto">
        <table className="table table-sm">
          <thead className="text-black">
            <tr>
              <th>姓名</th>
              <th>補正</th>
            </tr>
          </thead>
          <tbody>
            {registeredUsers.map((entry) => (
              // eslint-disable-next-line react/jsx-key
              <tr>
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
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      const register = mainRegisterMap[entry.mainRegisterId];
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
        </table>
      </div>
    </div>
  );
}
