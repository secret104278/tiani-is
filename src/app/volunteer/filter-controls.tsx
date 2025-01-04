"use client";

import { useFilter } from "./filter-context";

export default function FilterControls() {
  const {
    filterParticipatedByMe,
    setFilterParticipatedByMe,
    filterOrganizedByMe,
    setFilterOrganizedByMe,
  } = useFilter();

  return (
    <div className="flex flex-row flex-wrap">
      <label className="label cursor-pointer space-x-2">
        <span className="label-text">我發起的</span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={filterOrganizedByMe}
          onChange={() => setFilterOrganizedByMe((prev) => !prev)}
        />
      </label>
      <label className="label cursor-pointer space-x-2">
        <span className="label-text">我報名的</span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={filterParticipatedByMe}
          onChange={() => setFilterParticipatedByMe((prev) => !prev)}
        />
      </label>
    </div>
  );
}
