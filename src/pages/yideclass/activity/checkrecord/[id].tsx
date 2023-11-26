import { Combobox, Transition } from "@headlessui/react";
import {
  CheckIcon,
  ChevronUpDownIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { isNil } from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import { AlertWarning } from "~/components/Alert";
import ReactiveButton from "~/components/ReactiveButton";
import Dialog from "~/components/utils/Dialog";
import { api } from "~/utils/api";

function ManualClassActivityCheckRecordDialog({
  activityId,
}: {
  activityId: number;
}) {
  const router = useRouter();

  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
  } = api.user.getUsers.useQuery({});
  const {
    mutate: manualCheckInActivity,
    isLoading: manualCheckInActivityIsLoading,
    error: manualCheckInActivityError,
  } = api.classActivity.manualCheckInActivity.useMutation({
    onSuccess: () => router.reload(),
  });

  type User = {
    name: string | null;
    id: string;
  };

  const [selected, setSelected] = useState<User | undefined>();
  const [query, setQuery] = useState("");

  const filteredPeople =
    (query === ""
      ? users
      : users?.filter((user) => {
          return user.name?.toLowerCase().includes(query.toLowerCase());
        })) ?? [];

  if (usersIsLoading) return <div className="loading"></div>;
  if (usersError) return <AlertWarning>{usersError.message}</AlertWarning>;

  return (
    <>
      <form className="flex flex-col space-y-4">
        <div>
          <label className="label">
            <span className="label-text">班員</span>
          </label>
          <div>
            <Combobox value={selected} onChange={setSelected}>
              <div className="relative">
                <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                  <Combobox.Input
                    className="w-full border-none py-2 pl-3 pr-10 leading-8 text-gray-900 focus:ring-0"
                    displayValue={(person: User) => person.name ?? ""}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </Combobox.Button>
                </div>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  afterLeave={() => setQuery("")}
                >
                  <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                    {filteredPeople.length === 0 && query !== "" ? (
                      <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                        查無此人
                      </div>
                    ) : (
                      filteredPeople.map((person) => (
                        <Combobox.Option
                          key={person.id}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active
                                ? "bg-teal-600 text-white"
                                : "text-gray-900"
                            }`
                          }
                          value={person}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected ? "font-medium" : "font-normal"
                                }`}
                              >
                                {person.name}
                              </span>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                    active ? "text-white" : "text-teal-600"
                                  }`}
                                >
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </Transition>
              </div>
            </Combobox>
          </div>
        </div>
        <ReactiveButton
          className="btn btn-primary"
          disabled={isNil(selected)}
          loading={manualCheckInActivityIsLoading}
          error={manualCheckInActivityError?.message}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={() =>
            selected &&
            manualCheckInActivity({ activityId, userId: selected.id })
          }
        >
          送出
        </ReactiveButton>
      </form>
    </>
  );
}

export default function ClassActivityCheckRecordPage() {
  const { data: sessionData } = useSession();

  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, error } = api.classActivity.getActivity.useQuery({
    id: Number(id),
  });
  const { activity } = data ?? {};

  const { data: checkRecords, isLoading: isLoadingCheckRecords } =
    api.classActivity.getActivityCheckRecords.useQuery({
      activityId: Number(id),
    });

  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);

  if (!isNil(error)) return <AlertWarning>{error.message}</AlertWarning>;
  if (isLoading || isLoadingCheckRecords)
    return <div className="loading"></div>;
  if (isNil(activity)) return <AlertWarning>找不到課程</AlertWarning>;

  return (
    <div className="flex flex-col space-y-4">
      <Link className="link" href={`/yideclass/activity/detail/${activity.id}`}>
        ← {activity?.title}
      </Link>
      <article className="prose">
        <h1>打卡名單</h1>
      </article>
      {sessionData?.user.role.is_yideclass_admin && (
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
            <ManualClassActivityCheckRecordDialog activityId={activity.id} />
          </Dialog>
        </div>
      )}
      <table className="table table-sm">
        <thead>
          <tr>
            <th>班員</th>
            <th>簽到</th>
          </tr>
        </thead>
        <tbody>
          {checkRecords?.map((record) => (
            <tr key={record.userId}>
              <td>{record.user.name}</td>
              <td>
                {record.checkAt.toLocaleDateString()}
                <br />
                {record.checkAt.toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
