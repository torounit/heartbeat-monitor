import { getDeviceByName } from "../../services/devices";
import honoFactory from "../../services/honoFactory";

function NotFound({ name }: { name: string }) {
  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold sm:text-2xl">
        デバイスが見つかりません
      </h2>
      <p class="text-base-content/70 wrap-break-word">
        「{name}」は登録されていません。
      </p>
      <a href="/" class="btn btn-primary btn-sm">
        ダッシュボードへ戻る
      </a>
    </div>
  );
}

const app = honoFactory.createApp().get("/:device", async (c) => {
  // hono がパスパラメータをデコード済みで返す
  const deviceName = c.req.param("device");
  const db = c.get("db");

  const device = await getDeviceByName(db, deviceName);
  if (!device) {
    c.status(404);
    return c.render(<NotFound name={deviceName} />, {
      title: "デバイスが見つかりません",
    });
  }

  // 存在するデバイス名を data 属性で渡し、クライアント側でのパス解析を不要にする
  return c.render(<div id="root" data-device={device.name} />, {
    title: device.name,
  });
});

export default app;
