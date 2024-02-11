import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Fragment, useState } from "react";
import { api } from "~/utils/api";
import { AlertWarning } from "./utils/Alert";

export type UserComboboxSelected = {
  name: string | null;
  id: string;
};

export default function UserCombobox({
  selected,
  setSelected,
}: {
  selected: UserComboboxSelected | undefined;
  setSelected: (user: UserComboboxSelected) => void;
}) {
  const [query, setQuery] = useState("");

  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
  } = api.user.getUsers.useQuery({});

  const filteredPeople =
    (query === ""
      ? users
      : users?.filter((user) => {
          return user.name?.toLowerCase().includes(query.toLowerCase());
        })) ?? [];

  if (usersIsLoading) return <div className="loading"></div>;
  if (usersError) return <AlertWarning>{usersError.message}</AlertWarning>;

  return (
    <Combobox value={selected} onChange={setSelected}>
      <div className="relative">
        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
          <Combobox.Input
            className="w-full rounded-lg border py-2 pl-3 pr-10 leading-8 text-gray-900 focus:ring-0"
            displayValue={(person: UserComboboxSelected) =>
              person.name ?? "ERROR"
            }
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
                      active ? "bg-teal-600 text-white" : "text-gray-900"
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
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
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
  );
}
