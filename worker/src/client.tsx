import { render } from "hono/jsx/dom";

import Dashboard from "./ui/Dashboard";
import DeviceDetail from "./ui/DeviceDetail";
import {
  isDashboardData,
  isDeviceDetailData,
  readInitialData,
} from "./ui/initialData";

const root = document.getElementById("root");
if (root) {
  // サーバーが描画に使ったのと同じデータを data 属性から受け取る。
  // 初回描画がサーバー HTML と一致するため、差し替えが目に見えない。
  const deviceName = root.dataset.device;
  const initial = readInitialData(root);

  if (deviceName === undefined) {
    if (isDashboardData(initial)) {
      render(<Dashboard {...initial} />, root);
    }
  } else if (isDeviceDetailData(initial)) {
    render(<DeviceDetail deviceName={deviceName} {...initial} />, root);
  }
  // ガードが通らない場合は何もしない。サーバーが描画した HTML をそのまま残す。
  // 到達するのはデプロイ中のバージョン差程度で、空白にするより正しい。
}
