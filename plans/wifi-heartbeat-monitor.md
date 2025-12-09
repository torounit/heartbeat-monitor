## Plan: WiFi監視・LED表示・Worker応答（config.h / secrets.h分離）

WiFiは10秒タイムアウト接続・切断時10秒間隔で無制限再接続。接続試行中はLOAD、成功時はHEARTBEAT_LINE、通信失敗時は1秒ON/1秒OFF全点滅。Workerは`GET /`で`{"status":"ok"}`。URLは`arduino/src/config.h`、SSID/PASSは`.gitignore`対象の`arduino/src/secrets.h`。

### Steps
1. `arduino/platformio.ini`にWiFi/HTTP依存を追加してビルド前提を整備。
2. `arduino/src/config.h`にWorker URL定数を定義。
3. `arduino/src/secrets.h`にSSID/PASS定数を定義し、`.gitignore`へ`arduino/src/secrets.h`を追記。
4. `arduino/src/main.cpp`でWiFi接続/再接続（10秒タイムアウト・10秒間隔無制限）と状態管理、LED表示（LOAD→HEARTBEAT_LINE→全点滅1秒周期）を実装し、`config.h`/`secrets.h`を参照。
5. `main.cpp`でWorker URLへGETし`{"status":"ok"}`判定、失敗時の表示切替と再試行を追加。
6. `worker/src/index.ts`を`GET /`でJSON `{"status":"ok"}`を返す最小APIに更新。
