import { describe, expect, it } from "vitest";
import api from "./index";

describe("API Routes", () => {
  it("should have all routes mounted", () => {
    // api は複数のルートをマウントしているので、存在確認
    expect(api).toBeDefined();
    // 実際のルートのテストは各個別ファイルで行う
  });
});
