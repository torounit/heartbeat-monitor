# Heartbeat Monitor 開発ガイドライン

日本語で応答してください。

## プロジェクト概要

Arduino UNO R4 WiFi と Cloudflare Workers を使用したハートビートモニタリングシステム。
複数のデバイスから定期的にハートビートを受信し、稼働状態を監視します。

## 技術スタック

### Backend (Cloudflare Workers)
- **Runtime**: Cloudflare Workers
- **Framework**: Hono v4
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Language**: TypeScript (strict mode)
- **Build**: Vite
- **Testing**: Vitest with @cloudflare/vitest-pool-workers

### Frontend
- **Framework**: Hono JSX
- **Styling**: Tailwind CSS v4
- **Build**: Vite

### Device (Arduino)
- **Platform**: Arduino UNO R4 WiFi
- **Framework**: Arduino (Renesas RA)
- **Build System**: PlatformIO
- **Libraries**: ArduinoLEDMatrix, ArduinoHttpClient, WiFiS3

## ディレクトリ構造

```
heartbeat-monitor/
├── .github/              # GitHub設定とCopilot instructions
├── worker/               # Cloudflare Workers アプリケーション
│   ├── src/
│   │   ├── app/         # APIルートとダッシュボード
│   │   ├── client/      # フロントエンドコンポーネント
│   │   ├── db/          # データベーススキーマ
│   │   └── services/    # ビジネスロジック
│   ├── migrations/      # D1データベースマイグレーション
│   ├── scripts/         # ユーティリティスクリプト
│   └── test/            # テストファイル
├── arduino/              # Arduinoデバイスコード
│   └── src/
└── plans/                # プロジェクトの計画や仕様書
```

## コーディング規約

### TypeScript/JavaScript (Worker)

#### スタイルガイド
- **Linter**: ESLint with @hono/eslint-config, typescript-eslint (strict + stylistic)
- **Formatter**: Prettier
- **TypeScript**: strict mode 有効
- **Module System**: ESNext with Bundler resolution

#### コーディングパターン
- 常に TypeScript の strict mode を使用する
- Hono のルーターは機能ごとに分割する（`app/api/` 配下）
- データベースアクセスは `services/` 層に実装する
- 型定義は `types.ts` または各モジュール内で定義する
- Drizzle ORM のスキーマは `db/schema.ts` に集約する
- 環境変数は `CloudflareBindings` 型で型安全にアクセスする

#### データベース
- Drizzle ORM を使用してクエリを記述する
- マイグレーションファイルは `drizzle-kit generate` で自動生成する
- テーブルには適切なインデックスを設定する
- 外部キーには `onDelete: "cascade"` を設定する

#### テスト
- Vitest を使用してテストを記述する
- `@cloudflare/vitest-pool-workers` で Cloudflare Workers 環境をエミュレートする
- テストファイルは `*.test.ts` の命名規則を使用する
- 各 API エンドポイントに対してテストを作成する
- テストでは実際の D1 データベースを使用する（env.DB）

### Arduino/C++

#### スタイルガイド
- Arduino の標準的なコーディングスタイルに従う
- PlatformIO を使用してビルド・アップロードを行う
- 機能ごとにヘッダーファイル（.h）と実装ファイル（.cpp）に分割する

#### ベストプラクティス
- WiFi 接続は自動再接続ロジックを実装する
- ハートビート送信は定期的（60秒間隔）に実行する
- エラー時は LED マトリクスで視覚的にフィードバックする
- シークレット情報は `secrets.h` に格納する（Git 管理外）

## ビルド・テスト・デプロイ

### Worker

#### セットアップ
```bash
cd worker
npm install
```

#### 開発
```bash
npm run dev          # 開発サーバー起動（ホットリロード有効）
npm run lint         # ESLintでコードチェック
npm run lint:fix     # ESLintで自動修正
npm run format       # Prettierでフォーマット
npm run tsc          # TypeScriptの型チェック
```

#### テスト
```bash
npm run test         # Vitestでテスト実行
```

#### データベース
```bash
npm run generate-migration  # マイグレーションファイル生成
npm run migrate:local      # ローカルDBにマイグレーション適用
npm run migrate:remote     # リモートDBにマイグレーション適用
npm run seed               # ダミーデータ生成（開発用）
```

#### デプロイ
```bash
npm run build        # 本番用ビルド
npm run deploy       # Cloudflare Workers にデプロイ
npm run preview      # ローカルで本番環境をプレビュー
```

### Arduino

#### セットアップ
```bash
cd arduino
# secrets.h を作成して WiFi 情報等を設定
cp src/secrets.h.sample src/secrets.h
```

#### ビルド・アップロード
```bash
pio run              # ビルドのみ
pio run --target upload  # ビルドしてArduinoにアップロード
pio device monitor   # シリアルモニター起動
```

## API エンドポイント

### POST /api/heartbeat
デバイスからハートビートを受信する

**Request Body:**
```json
{
  "device": "device-name"
}
```

### GET/POST /api/devices
デバイスの一覧取得・登録

### GET /
Web ダッシュボード（全デバイスのステータス表示）

## 環境変数

### Cloudflare Workers
- `DB`: D1 データベースバインディング（必須）
- `DISCORD_WEBHOOK_URL`: Discord通知用WebhookURL（オプション）

### Arduino
- `WORKER_HOSTNAME`: Workers のホスト名
- `WIFI_SSID`: WiFi SSID
- `WIFI_PASSWORD`: WiFi パスワード
- `DEVICE_NAME`: デバイス名
- `CF_ACCESS_CLIENT_ID`: Cloudflare Access ID（オプション）
- `CF_ACCESS_CLIENT_SECRET`: Cloudflare Access Secret（オプション）

## ステータス定義

デバイスのステータスは以下の4種類:
- `ok`: 正常（2分以内にハートビート受信）
- `warn`: 警告（2-5分間ハートビート未受信）
- `error`: エラー（5分以上ハートビート未受信）
- `pending`: 保留（ハートビート未受信）

## 開発ワークフロー

1. **変更前**: 関連するテストを確認・実行する
2. **コード変更**: 最小限の変更を心がける
3. **Lint/Format**: `npm run lint:fix && npm run format` を実行
4. **型チェック**: `npm run tsc` で TypeScript エラーがないか確認
5. **テスト**: `npm run test` で既存テストが通ることを確認
6. **動作確認**: `npm run dev` でローカルで動作確認
7. **コミット**: 意味のある単位で変更をコミット

## 注意事項

- データベーススキーマ変更時は必ずマイグレーションファイルを生成する
- 環境変数やシークレットはコードに直接記述しない
- Arduino のシークレット情報は `secrets.h.sample` をテンプレートとして使用
- D1 データベースは SQLite ベースだが、一部機能制限があることに注意
- Cloudflare Workers は V8 Isolate 上で実行され、Node.js API は使用できない
