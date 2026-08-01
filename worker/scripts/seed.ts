import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";
import type { status } from "../src/types";

/**
 * ローカル開発用のダミーデータを生成するスクリプト
 * 使用方法: npm run seed
 *
 * このスクリプトはローカルのD1データベースファイル（.wrangler/state/v3/d1/miniflare-D1DatabaseObject/）に
 * 直接接続してダミーデータを生成します。
 */

// データベースファイルのパスを取得
function getDatabasePath(): string {
  const d1Dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";

  if (!existsSync(d1Dir)) {
    throw new Error(
      `D1ディレクトリが見つかりません: ${d1Dir}\n` +
        `先に "npm run migrate:local" を実行してください。`,
    );
  }

  // ディレクトリ内の.sqliteファイルを取得
  const files = readdirSync(d1Dir).filter((file) => file.endsWith(".sqlite"));

  if (files.length === 0) {
    throw new Error(
      `データベースファイルが見つかりません。\n` +
        `先に "npm run migrate:local" を実行してください。`,
    );
  }

  // 複数ある場合は、最も新しいファイルを使用（または最大サイズのファイル）
  // ここでは各ファイルをチェックしてテーブルがあるものを選択
  for (const file of files) {
    const dbPath = `${d1Dir}/${file}`;
    try {
      const result = execSync(`sqlite3 "${dbPath}" ".tables"`, {
        encoding: "utf-8",
      });
      if (result.includes("devices") && result.includes("heartbeats")) {
        return dbPath;
      }
    } catch {
      // このファイルは使えない、次へ
    }
  }

  throw new Error(
    `マイグレーション済みのデータベースファイルが見つかりません。\n` +
      `先に "npm run migrate:local" を実行してください。`,
  );
}

// ランダムな日時を生成（過去N日以内）
function randomDate(daysAgo: number): string {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const random =
    past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(random).toISOString();
}

// ステータスの重み付きランダム選択
function randomStatus(): status {
  const rand = Math.random();
  if (rand < 0.7) return "ok"; // 70%
  if (rand < 0.85) return "warn"; // 15%
  if (rand < 0.95) return "error"; // 10%
  return "pending"; // 5%
}

function seed() {
  // ローカルのD1データベースファイルのパスを取得
  const dbPath = getDatabasePath();

  console.log(`📂 データベースファイル: ${dbPath}`);

  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });

  console.log("🌱 シードデータの生成を開始します...");

  // 既存データのクリア
  console.log("📝 既存データをクリアしています...");
  db.delete(schema.reports).run();
  db.delete(schema.heartbeats).run();
  db.delete(schema.devices).run();

  // Deviceの作成
  const deviceNames = [
    "Arduino-Device-1",
    "Arduino-Device-2",
    "Raspberry-Pi-A",
    "ESP32-Sensor-1",
    "Office-Monitor",
  ];

  console.log(
    `📍 ${String(deviceNames.length)}個のデバイスを作成しています...`,
  );
  const deviceIds: number[] = [];

  for (const name of deviceNames) {
    const result = db.insert(schema.devices).values({ name }).returning().get();
    deviceIds.push(result.id);
    console.log(`  ✓ ${name} (ID: ${String(result.id)})`);
  }

  // 各Deviceにハートビートとレポートを生成
  for (let i = 0; i < deviceIds.length; i++) {
    const deviceId = deviceIds[i];
    const deviceName = deviceNames[i];

    console.log(`\n💓 ${deviceName} のハートビートとレポートを生成中...`);

    const heartbeatCount = 100 + Math.floor(Math.random() * 900);
    const heartbeats = Array.from({ length: heartbeatCount }, () => ({
      deviceId,
      createdAt: randomDate(0.5),
    }));

    // 日付でソート
    heartbeats.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // バッチでインサート（50件ずつ - SQLiteの変数制限999個に対応）
    for (let j = 0; j < heartbeats.length; j += 50) {
      const batch = heartbeats.slice(j, j + 50);
      db.insert(schema.heartbeats).values(batch).run();
    }
    console.log(`  ✓ ${String(heartbeatCount)}個のハートビートを生成`);

    // レポート生成（ステータス変更時のログ）
    const reportCount = 5 + Math.floor(Math.random() * 15);
    const reports = Array.from({ length: reportCount }, () => ({
      deviceId,
      status: randomStatus(),
      createdAt: randomDate(0.5),
    }));

    // 日付でソート
    reports.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    db.insert(schema.reports).values(reports).run();
    console.log(`  ✓ ${String(reportCount)}個のレポートを生成`);
  }

  console.log("\n✅ シードデータの生成が完了しました！");
  console.log("\n📊 生成されたデータ:");
  console.log(`  - Devices: ${String(deviceIds.length)}個`);

  const totalHeartbeats = db.select().from(schema.heartbeats).all();
  console.log(`  - Heartbeats: ${String(totalHeartbeats.length)}個`);

  const totalReports = db.select().from(schema.reports).all();
  console.log(`  - Reports: ${String(totalReports.length)}個`);

  sqlite.close();
}

// スクリプト実行
try {
  seed();
  console.log("\n🎉 完了しました！");
} catch (error) {
  console.error("❌ エラーが発生しました:", error);
  throw error;
}
