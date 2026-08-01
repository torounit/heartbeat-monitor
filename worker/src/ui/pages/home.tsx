import type { DeviceStatus } from "../../services/heartbeats";
import type { DeviceWithReports } from "../../services/reports";
import { fetchDeviceReports, fetchStatus } from "../api";
import DeviceStatusCard from "../components/DeviceStatusCard";
import ReportList from "../components/ReportList";
import type { DashboardData } from "../initialData";
import { usePolling } from "../polling";
import { deviceHref } from "../utils";

function Status({ statuses }: { statuses: DeviceStatus[] }) {
  const live = usePolling(statuses, fetchStatus);

  if (live.length === 0) {
    return <p class="text-base-content/60">デバイスが登録されていません</p>;
  }

  return (
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {live.map((status) => (
        <DeviceStatusCard key={status.device} status={status} />
      ))}
    </div>
  );
}

function Reports({ deviceReports }: { deviceReports: DeviceWithReports[] }) {
  const live = usePolling(deviceReports, fetchDeviceReports);

  if (live.length === 0) {
    return <p class="text-base-content/60">デバイスが登録されていません</p>;
  }

  return (
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {live.map(({ name, reports }) => (
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

function Dashboard({ statuses, deviceReports }: DashboardData) {
  return (
    <div class="space-y-10">
      <section class="space-y-4">
        <h2 class="text-xl font-semibold sm:text-2xl">Status</h2>
        <Status statuses={statuses} />
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold sm:text-2xl">Reports</h2>
        <Reports deviceReports={deviceReports} />
      </section>
    </div>
  );
}

export default Dashboard;
