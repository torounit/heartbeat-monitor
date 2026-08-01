import { describe, expect, it } from "vitest";

import { mountablePages } from "./index";

describe("mountablePages", () => {
  // name は data-page でページを引き当てるキー。重複するとどちらかが
  // 永久にマウントされないが、実行時には何のエラーも出ない。
  it("should keep page names unique", () => {
    const names = mountablePages.map((page) => page.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("should not register an empty name", () => {
    for (const page of mountablePages) {
      expect(page.name).not.toBe("");
    }
  });
});
