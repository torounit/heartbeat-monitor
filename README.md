# Heartbeat Monitor

Arduino UNO R4 WiFi と Cloudflare Workers を使用したハートビートモニタリングシステムです。

## 概要

複数のデバイス（location）から定期的にハートビートを受信し、稼働状態を監視するシステムです。

### 主な機能

- ハートビート受信とステータス監視（ok / warn / error / pending）
- ステータス変更時のレポート記録とDiscord通知
- Webダッシュボードでの状態確認

## システム構成

```
┌─────────────────┐
│ Arduino Device  │ ──HTTP POST──> ┌──────────────────────┐
│ (送信側)         │                │ Cloudflare Workers   │
└─────────────────┘                │ + Hono API           │
                                   │ + D1 Database        │
                                   └──────────┬───────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────┐
                    │                         │                     │
                    v                         v                     v
          ┌──────────────────┐    ┌──────────────────┐   ┌─────────────────┐
          │ Web Dashboard    │    │ Scheduled Task   │   │ Discord Webhook │
          │ (閲覧)            │    │ (1分ごと監視)     │   │ (通知)           │
          └──────────────────┘    └──────────────────┘   └─────────────────┘
```

## 技術スタック

- **Backend**: Cloudflare Workers + Hono v4 + Drizzle ORM
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Hono JSX + Vite + Tailwind CSS
- **Device**: Arduino UNO R4 WiFi (PlatformIO)

## 使い方

### セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/torounit/heartbeat-monitor.git
cd heartbeat-monitor/worker

# 2. 依存関係をインストール
npm install

# 3. 環境変数を設定（ローカル開発用）
cp .env.sample .env
# .env ファイルを編集して必要な値を設定

# 4. Cloudflare Workers の環境変数を設定（本番環境）
wrangler secret put DISCORD_WEBHOOK_URL  # オプション

# 6. データベースを作成
wrangler d1 create heartbeat-monitor
# 出力されたdatabase_idをメモする

# 7. wrangler.jsonc の d1_databases セクションに database_id を設定
# wrangler.jsonc の該当箇所:
# {
#   "binding": "DB",
#   "database_name": "heartbeat-monitor",
#   "database_id": "ここに出力されたdatabase_idを設定"
# }

# 8. マイグレーション実行
npm run migrate:remote

# 9. デプロイ
npm run deploy
```

### ローカル開発

```bash
# 1. ローカルデータベースのマイグレーション実行
npm run migrate:local

# 2. ダミーデータの生成（オプション）
npm run seed

# 3. 開発サーバー起動
npm run dev
```

ダミーデータの生成では以下が作成されます:
- 5個のロケーション（デバイス）
- 各ロケーションの過去7日間のハートビート履歴（100-150件）
- ステータス変更レポート（5-20件）

### デバイスの登録

```bash
curl -X POST https://your-worker.workers.dev/api/locations/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Arduino-Device-1"}'
```

### ハートビート送信

```bash
curl -X POST https://your-worker.workers.dev/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"device": "Arduino-Device-1"}'
```

### ダッシュボード

ブラウザで `https://your-worker.workers.dev/dashboard` にアクセス

## Arduino デバイスのセットアップ

### 必要なもの

- Arduino UNO R4 WiFi
- PlatformIO（推奨）または Arduino IDE

### セットアップ手順

```bash
cd arduino

# secrets.h.sample をコピーして secrets.h を作成
cp src/secrets.h.sample src/secrets.h

# secrets.h を編集して以下を設定:
# - WORKER_HOSTNAME: Workers のホスト名（例: your-worker.workers.dev）
# - WIFI_SSID: WiFi SSID
# - WIFI_PASSWORD: WiFi パスワード
# - DEVICE_NAME: デバイス名
# - CF_ACCESS_CLIENT_ID: Cloudflare Access クライアントID（オプション）
# - CF_ACCESS_CLIENT_SECRET: Cloudflare Access クライアントシークレット（オプション）

# PlatformIO でビルド＆アップロード
pio run --target upload
```

デバイスは60秒ごとに自動的にハートビートを送信します。

## ライセンス

MIT
