//./components/CountriesAutoComplete.tsx

import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import Autocomplete from "./Autocomplete";

//return type for restcountries.com api.
//do this for the static type checking. very important!
type Country = {
  name: {
    common: string;
  };
};

export default function UsersAutocomplete() {
  //query typed by user
  const [val, setVal] = useState("");

  //a list to hold all the countries
  const [countries, setCountries] = useState<string[]>([]);

  //a list to show on the dropdown when user types
  const [items, setItems] = useState<string[]>([]);

  const { data: users } = api.user.getUsersWithImage.useQuery({});

  useEffect(() => {
    //if there is no value, return the countries list.
    if (!val) {
      setItems(countries);
      return;
    }

    //if the val changes, we filter items so that it can be filtered. and set it as new state
    const newItems = countries
      .filter((p) => p.toLowerCase().includes(val.toLowerCase()))
      .sort();
    setItems(newItems);
  }, [countries, val]);

  //use the common auto complete component here.
  return (
    <Autocomplete
      items={items}
      value={val}
      onChange={setVal}
      renderItem={() => <></>}
    />
  );
}
