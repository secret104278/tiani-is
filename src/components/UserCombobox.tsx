import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import type { inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import type { UserRouter } from "~/server/api/routers/user";
import { api } from "~/utils/api";
import { AlertWarning } from "./utils/Alert";
import { Loading } from "./utils/Loading";

export type User = inferRouterOutputs<UserRouter>["getUsersBasic"][number];

export type UserComboboxSelected = User | null;

export default function UserCombobox({
  selected,
  setSelected,
}: {
  selected: UserComboboxSelected;
  setSelected: (user: UserComboboxSelected) => void;
}) {
  const [query, setQuery] = useState("");

  const {
    data: users,
    isLoading: usersIsLoading,
    error: usersError,
  } = api.user.getUsersBasic.useQuery();

  if (usersIsLoading) return <Loading />;
  if (usersError) return <AlertWarning>{usersError.message}</AlertWarning>;

  const filteredPeople =
    query === ""
      ? (users ?? [])
      : (users ?? []).filter((user) => {
          return user.name?.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <Combobox
      immediate
      value={selected}
      onChange={setSelected}
      onClose={() => setQuery("")}
    >
      <div className="relative">
        <div className="relative w-full cursor-default overflow-hidden rounded-[.5em] bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
          <ComboboxInput
            className="w-full rounded-[.5em] border py-2 pr-10 pl-3 text-gray-900 leading-8 focus:ring-0"
            displayValue={(person: UserComboboxSelected) => person?.name ?? ""}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </ComboboxButton>
        </div>

        <ComboboxOptions
          className="absolute mt-1 max-h-60 w-full overflow-auto rounded-[.5em] bg-white py-1 text-base shadow-lg ring-1 ring-black/5 transition duration-100 ease-out empty:invisible focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 sm:text-sm"
          transition
        >
          {filteredPeople.length === 0 && query !== "" ? (
            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
              查無此人
            </div>
          ) : (
            filteredPeople.map((person) => (
              <ComboboxOption
                key={person.id}
                className={({ focus }) =>
                  `relative cursor-default select-none py-2 pr-4 pl-10 ${
                    focus
                      ? "cursor-pointer bg-teal-600 text-white"
                      : "text-gray-900"
                  }`
                }
                value={person}
              >
                {({ selected, focus }) => (
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
                          focus ? "text-white" : "text-teal-600"
                        }`}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
