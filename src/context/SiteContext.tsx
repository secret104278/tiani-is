import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { type Site, getUnitBySlug, urlBaseToSite } from "~/utils/ui";

// Define the context type
type SiteContextType = {
  site: Site | undefined;
  setSite: React.Dispatch<React.SetStateAction<Site | undefined>>;
  unitName: string | undefined;
};

// Create the context
const SiteContext = createContext<SiteContextType | undefined>(undefined);

// Create a context provider component
export const SiteProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [site, setSite] = useState<Site | undefined>(
    urlBaseToSite(router.pathname.split("/")[1]),
  );

  const unitSlug = router.query.unitSlug as string;
  const unitName = getUnitBySlug(unitSlug)?.name;

  useEffect(() => {
    setSite(urlBaseToSite(router.pathname.split("/")[1]));
  }, [router.pathname]);

  return (
    <SiteContext.Provider value={{ site, setSite, unitName }}>
      {children}
    </SiteContext.Provider>
  );
};

// Create a custom hook for accessing the context
export const useSiteContext = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSiteContext must be used within a SiteProvider");
  }
  return context;
};
