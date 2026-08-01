import { describe, expect, it } from "vitest";

import { deviceHref, formatDateTime, formatElapsed } from "./utils";

describe("formatDateTime", () => {
  // Workers ランタイムは UTC で動くため、タイムゾーンを固定していなければ
  // ここは "2026/01/02 15:30" になる。ブラウザ（JST）との不一致を検知する。
  it("should format in JST regardless of the runtime time zone", () => {
    expect(formatDateTime("2026-01-02T15:30:00Z")).toBe("2026/01/03 00:30");
  });

  it("should handle the legacy 'YYYY-MM-DD HH:MM:SS' form as UTC", () => {
    expect(formatDateTime("2026-01-02 15:30:00")).toBe("2026/01/03 00:30");
  });

  it("should return a dash for empty input", () => {
    // pending なデバイスは lastLogAt が空文字
    expect(formatDateTime("")).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
  });

  it("should return a dash for an unparsable value", () => {
    expect(formatDateTime("nonsense")).toBe("—");
  });
});

describe("formatElapsed", () => {
  it("should format seconds, minutes, hours and days", () => {
    expect(formatElapsed(0)).toBe("0秒前");
    expect(formatElapsed(59)).toBe("59秒前");
    expect(formatElapsed(60)).toBe("1分前");
    expect(formatElapsed(3599)).toBe("59分前");
    expect(formatElapsed(3600)).toBe("1時間前");
    expect(formatElapsed(86_399)).toBe("23時間前");
    expect(formatElapsed(86_400)).toBe("1日前");
  });

  it("should return a dash when the elapsed time is unknown", () => {
    expect(formatElapsed(undefined)).toBe("—");
  });
});

describe("deviceHref", () => {
  it("should percent-encode characters that would break the path", () => {
    // hono の RPC クライアントもリンクもこの関数を通す前提
    expect(deviceHref("SWEET WORK / Arduino")).toBe(
      "/devices/SWEET%20WORK%20%2F%20Arduino",
    );
    expect(deviceHref('Quote "X" & <Y>')).toBe(
      "/devices/Quote%20%22X%22%20%26%20%3CY%3E",
    );
  });
});
