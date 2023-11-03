import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Site = "volunteer" | "yideclass";

// Define the context type
type SiteContextType = {
  site: Site;
  setSite: React.Dispatch<React.SetStateAction<Site>>;
};

// Create the context
const SiteContext = createContext<SiteContextType | undefined>(undefined);

// Create a context provider component
export const SiteProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [site, setSite] = useState<Site>(
    router.pathname.split("/")[1] === "yideclass" ? "yideclass" : "volunteer",
  );

  useEffect(() => {
    const base = router.pathname.split("/")[1];
    if (base === "volunteer") setSite("volunteer");
    else if (base === "yideclass") setSite("yideclass");
  }, [router.pathname]);

  useEffect(() => {
    if (site === "volunteer")
      document.querySelector("html")?.setAttribute("data-theme", "autumn");
    else if (site === "yideclass")
      document.querySelector("html")?.setAttribute("data-theme", "pastel");
  }, [site]);

  return (
    <SiteContext.Provider value={{ site, setSite }}>
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
