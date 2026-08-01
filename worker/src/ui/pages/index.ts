import type { MountablePage } from "../definePage";
import { deviceDetailsPage } from "./devices/details";
import { homePage } from "./home";

/**
 * client.tsx が data-page から引くページ一覧。
 * サーバーサイドレンダリングするページを増やしたらここに1行足す。
 * client.tsx は触らない。
 */
export const mountablePages: readonly MountablePage[] = [
  homePage,
  deviceDetailsPage,
];
