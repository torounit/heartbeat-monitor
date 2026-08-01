import { ErrorBoundary, Suspense, use } from "hono/jsx/dom";

import type { DeviceStatus, DeviceWithReports } from "../api";
import { client } from "../api";
import DeviceStatusCard from "../components/DeviceStatusCard";
import ErrorState from "../components/ErrorState";
import ReportList from "../components/ReportList";
import { deviceHref } from "../utils";

const REPORTS_PREVIEW_LIMIT = 5;

async function fetchStatus(): Promise<DeviceStatus[]> {
  const res = await client.api.status.$get();
  return res.json();
}

async function fetchReports(): Promise<DeviceWithReports[]> {
  const res = await client.api.devices.reports.$get({
    query: { limit: String(REPORTS_PREVIEW_LIMIT) },
  });
  return res.json();
}

function Loading() {
  return <p class="text-base-content/60">Loading...</p>;
}

function Status({ statusPromise }: { statusPromise: Promise<DeviceStatus[]> }) {
  const statuses = use(statusPromise);

  if (statuses.length === 0) {
    return <p class="text-base-content/60">デバイスが登録されていません</p>;
  }

  return (
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {statuses.map((status) => (
        <DeviceStatusCard key={status.device} status={status} />
      ))}
    </div>
  );
}

function Reports({
  deviceReportsPromise,
}: {
  deviceReportsPromise: Promise<DeviceWithReports[]>;
}) {
  const devices = use(deviceReportsPromise);

  if (devices.length === 0) {
    return <p class="text-base-content/60">デバイスが登録されていません</p>;
  }

  return (
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {devices.map(({ name, reports }) => (
        <div
          key={name}
          class="card border border-base-300 bg-base-100 shadow-sm"
        >
          <div class="card-body gap-2 p-4">
            <h3 class="font-semibold wrap-break-word">{name}</h3>
            <ReportList reports={reports} />
            <a
              href={deviceHref(name)}
              class="link link-primary self-end text-sm"
            >
              すべて見る →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  return (
    <div class="space-y-10">
      <section class="space-y-4">
        <h2 class="text-xl font-semibold sm:text-2xl">Status</h2>
        <ErrorBoundary fallback={<ErrorState />}>
          <Suspense fallback={<Loading />}>
            <Status statusPromise={fetchStatus()} />
          </Suspense>
        </ErrorBoundary>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold sm:text-2xl">Reports</h2>
        <ErrorBoundary fallback={<ErrorState />}>
          <Suspense fallback={<Loading />}>
            <Reports deviceReportsPromise={fetchReports()} />
          </Suspense>
        </ErrorBoundary>
      </section>
    </div>
  );
}

export default Dashboard;
