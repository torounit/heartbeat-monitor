import { readInitialData } from "./ui/initialData";
import { mountablePages } from "./ui/pages";

// サーバーが描画に使ったのと同じデータを data 属性から受け取る。
// 初回描画がサーバー HTML と一致するため、差し替えが目に見えない。
const root = document.getElementById("root");
if (root) {
  const page = mountablePages.find((p) => p.name === root.dataset.page);
  // 該当ページが無い場合もデータの形が合わない場合も何もしない。
  // サーバーが描画した HTML をそのまま残す。
  page?.mount(root, readInitialData(root));
}
