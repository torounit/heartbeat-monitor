#include <Arduino.h>
#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include "config.h"
#include "secrets.h"
#include "led_matrix.h"

// WiFi client
WiFiSSLClient wifiSSLClient;
HttpClient httpClient = HttpClient(wifiSSLClient, WORKER_HOSTNAME, 443);

enum State {
  STATE_STARTUP,           // 起動中
  STATE_CONNECTING,      // WiFi接続試行中
  STATE_SUCCESS,         // 通信成功
  STATE_FAILURE,         // 通信失敗
};

State currentState = STATE_STARTUP;

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



// WiFi接続処理
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
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed");
  }
}

// Workerへのハートビート送信
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

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Heartbeat Monitor Started");
  initLedMatrix();

  setState(STATE_CONNECTING);
}

void loop() {


  // Check WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  } else {
    // WiFi connected, send heartbeat check
    sendHeartbeat();
  }

  delay(10000); // Wait 10 seconds before next attempt
}
