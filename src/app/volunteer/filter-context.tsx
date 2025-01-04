import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface FilterContextType {
  filterParticipatedByMe: boolean;
  setFilterParticipatedByMe: Dispatch<SetStateAction<boolean>>;

  filterOrganizedByMe: boolean;
  setFilterOrganizedByMe: Dispatch<SetStateAction<boolean>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filterOrganizedByMe, setFilterOrganizedByMe] = useState(false);
  const [filterParticipatedByMe, setFilterParticipatedByMe] = useState(false);

  return (
    <FilterContext.Provider
      value={{
        filterParticipatedByMe,
        setFilterParticipatedByMe,
        filterOrganizedByMe,
        setFilterOrganizedByMe,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
}
