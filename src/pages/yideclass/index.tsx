import { ClockIcon } from "@heroicons/react/20/solid";

export default function YiDeClassHome() {
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>開班總覽</h1>
      </article>
      <div className="stats stats-vertical shadow-lg sm:stats-horizontal">
        <div className="stat">
          <div className="stat-figure text-primary">
            <ClockIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">總開班時數</div>
          <div className="stat-value">1.02</div>
        </div>
      </div>
    </div>
  );
}
