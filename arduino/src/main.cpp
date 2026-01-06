#include <Arduino.h>
#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include "config.h"
#include "secrets.h"
#include "led_matrix.h"

WiFiSSLClient wifiSSLClient;
HttpClient httpClient = HttpClient(wifiSSLClient, WORKER_HOSTNAME, 443);

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
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED &&
    millis() - startTime < WIFI_TIMEOUT_SECONDS * 1000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
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
  sprintf(json, "{\"location\":\"%s\"}", WIFI_SSID);
  httpClient.post("/api/heartbeat", "application/json", json);

  int statusCode = httpClient.responseStatusCode();
  String response = httpClient.responseBody();

  Serial.print("Status code: ");
  Serial.println(statusCode);
  Serial.print("Response: ");
  Serial.println(response);

  if (statusCode >= 200 && statusCode < 300) {
    setState(STATE_SUCCESS);
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

  setState(STATE_CONNECTING);
}

/**
 * @fn
 * Arduinoのメインループ関数。
 */
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    delay(WIFI_RECONNECT_INTERVAL_SECONDS * 1000);
  } else {
    sendHeartbeat();
    delay(HEARTBEAT_INTERVAL_SECONDS * 1000);
  }
}
