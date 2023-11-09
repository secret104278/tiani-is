import classNames from "classnames";
import { ReactElement, useRef, useState } from "react";

type AutocompleteProps<T> = {
  items: T[];
  renderItem: (item: T, i: number) => ReactElement<HTMLLIElement>;
  value: string;
  onChange: (val: string) => void;
};

const Autocomplete = <T,>({
  items,
  renderItem,
  value,
  onChange,
}: AutocompleteProps<T>) => {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <div
      // use classnames here to easily toggle dropdown open
      className={classNames({
        "dropdown w-full": true,
        "dropdown-open": open,
      })}
      ref={ref}
    >
      <input
        type="text"
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SAS.."
        tabIndex={0}
      />

      <div className="dropdown-content top-14 max-h-52 flex-col overflow-auto rounded-md bg-base-200">
        <ul
          className="menu-compact menu "
          style={{ width: ref.current?.clientWidth }}
        >
          {items.map((item, index) => renderItem(item, index))}
        </ul>
      </div>
    </div>
  );
};

// export default memo(Autocomplete);
export default Autocomplete;
