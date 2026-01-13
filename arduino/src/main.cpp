#include <Arduino.h>
#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include <WDT.h>
#include "config.h"
#include "secrets.h"
#include "led_matrix.h"

WiFiSSLClient wifiSSLClient;
HttpClient httpClient = HttpClient(wifiSSLClient, WORKER_HOSTNAME, 443);

// 起動時刻を記録する変数
unsigned long bootTime = 0;

// 最後にSTATE_SUCCESSになった時刻を記録する変数
unsigned long lastSuccessTime = 0;

/**
 * @enum
 * システムの状態を表す列挙型。
 */
enum State {
  STATE_STARTUP,           // 起動中
  STATE_CONNECTING,      // WiFi接続試行中
  STATE_SUCCESS,         // 通信成功
  STATE_FAILURE,         // 通信失敗
};

State currentState = STATE_STARTUP;

/**
 * @fn
 * 状態を変更し、対応するLED表示を更新する。
 * @param newState 新しい状態
 */
void setState(State newState) {

  if (currentState == newState) {
    return;
  }

  currentState = newState;

  switch (currentState) {
    case STATE_CONNECTING:
      displayConnecting();
      break;
    case STATE_SUCCESS:
      displayConnected();
      break;
    case STATE_FAILURE:
      displayFailure();
      break;
  }
}

/**
 * @fn
 * WiFiに接続する。
 * タイムアウト設定付きで、接続状態を管理する。
 */
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi already connected");
    return;
  }

  Serial.print("Attempting to connect to WiFi: ");
  Serial.println(WIFI_SSID);

  setState(STATE_CONNECTING);


  // タイムアウト付きWiFi接続
  unsigned long startTime = millis();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED &&
    millis() - startTime < WIFI_TIMEOUT_SECONDS * 1000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    delay(1000);
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed");
  }
}

/**
 * @fn
 * Workerエンドポイントにハートビートチェックを送信する。
 */
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  Serial.println("Sending heartbeat check...");
  char json[128];
  sprintf(json, "{\"device\":\"%s\"}", DEVICE_NAME);

  // カスタムヘッダーを追加
  Serial.println("Starting HTTP POST request...");
  httpClient.beginRequest();
  httpClient.post("/api/heartbeat");
  httpClient.sendHeader("Content-Type", "application/json");
  httpClient.sendHeader("Content-Length", strlen(json));

#ifdef USE_CF_ACCESS
  httpClient.sendHeader("CF-Access-Client-Id", CF_ACCESS_CLIENT_ID);
  httpClient.sendHeader("CF-Access-Client-Secret", CF_ACCESS_CLIENT_SECRET);
  Serial.println("Cloudflare Access headers added.");
#endif

  httpClient.beginBody();
  httpClient.print(json);
  httpClient.endRequest();
  Serial.println("HTTP POST request sent.");

  int statusCode = httpClient.responseStatusCode();
  Serial.print("Status code: ");
  Serial.println(statusCode);

  if (statusCode >= 200 && statusCode < 300) {
    String response = httpClient.responseBody();
    Serial.print("Response: ");
    Serial.println(response);

    setState(STATE_SUCCESS);

    // 成功時刻を記録
    lastSuccessTime = millis();
    Serial.println("Heartbeat successful!");
  } else {
    setState(STATE_FAILURE);
    Serial.println("Heartbeat failed!");
  }
}

/**
 * @fn
 * Arduinoのセットアップ関数。
 */
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Heartbeat Monitor Started");
  initLedMatrix();

  // 起動時刻を記録
  bootTime = millis();
  Serial.print("Boot time recorded: ");
  Serial.println(bootTime);

  setState(STATE_CONNECTING);
}

/**
 * @fn
 * ウォッチドッグタイマーで再起動を実行する。
 * @param reason 再起動の理由
 */
void performReboot(const char* reason) {
  Serial.print("Reboot triggered: ");
  Serial.println(reason);
  Serial.println("Rebooting in 3 seconds...");
  delay(3000);

  // ウォッチドッグタイマーで再起動
  WDT.begin(1000);  // 1秒でタイムアウト
  while(true) {
    // ウォッチドッグタイマーをリフレッシュしないことで再起動
  }
}

/**
 * @fn
 * Arduinoのメインループ関数。
 */
void loop() {
  unsigned long currentTime = millis();
  unsigned long elapsedTime = currentTime - bootTime;

  // 最後の成功から指定時間経過したら再起動（優先度高）
  // ただし、最初の成功があった場合のみチェック
  if (lastSuccessTime > 0) {
    unsigned long timeSinceLastSuccess = currentTime - lastSuccessTime;
    if (timeSinceLastSuccess >= FAILURE_REBOOT_TIMEOUT_SECONDS * 1000) {
      performReboot("No success state for extended period");
    }
  }

  // 起動から指定時間経過したら再起動（定期再起動）
  if (elapsedTime >= AUTO_REBOOT_INTERVAL_SECONDS * 1000) {
    performReboot("Auto reboot after 1 hour");
  }

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    delay(WIFI_RECONNECT_INTERVAL_SECONDS * 1000);
  } else {
    sendHeartbeat();
    delay(HEARTBEAT_INTERVAL_SECONDS * 1000);
  }
}
