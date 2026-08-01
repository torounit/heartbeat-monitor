import { render } from "hono/jsx/dom";

import Dashboard from "./ui/Dashboard";
import DeviceDetail from "./ui/DeviceDetail";

const root = document.getElementById("root");
if (root) {
  // サーバー側がデコード済みのデバイス名を data 属性で渡す（詳細ページのみ）
  const deviceName = root.dataset.device;
  render(
    deviceName === undefined ? (
      <Dashboard />
    ) : (
      <DeviceDetail deviceName={deviceName} />
    ),
    root,
  );
}
