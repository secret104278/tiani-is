"use client";

import { Suspense } from "react";
import Loading from "~/app/_components/basic/loading";
import ActivityList from "./activity-list";
import { FilterProvider } from "./filter-context";
import FilterControls from "./filter-controls";

export default function ClientActivitySection() {
  return (
    <FilterProvider>
      <FilterControls />
      <Suspense fallback={<Loading />}>
        <ActivityList />
      </Suspense>
    </FilterProvider>
  );
}
