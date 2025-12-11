#include <Arduino.h>
#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include <Arduino_LED_Matrix.h>
#include "config.h"
#include "secrets.h"
#include "led_matrix.h"

// LED Matrix instance
ArduinoLEDMatrix matrix;

// WiFi client
WiFiSSLClient wifiSSLClient;
HttpClient httpClient = HttpClient(wifiSSLClient, "heartbeat-monitor.torounit.workers.dev", 443);

enum State {
  STATE_STARTUP,           // 起動中
  STATE_CONNECTING,      // WiFi接続試行中
  STATE_SUCCESS,         // 通信成功
  STATE_FAILURE,         // 通信失敗
  STATE_WIFI_DISCONNECTED // WiFi切断
};

State currentState = STATE_STARTUP;


void displayConnecting() {
  matrix.loadSequence(LEDMATRIX_ANIMATION_BOUNCING_BALL);
  matrix.play(true);
}

void displayConnected() {
  matrix.loadSequence(LEDMATRIX_ANIMATION_HEARTBEAT_LINE);
  matrix.play(true);
}

void displayDisconnected() {
  matrix.loadSequence(LEDMATRIX_ANIMATION_WIFI_SEARCH);
  matrix.play(true);
}

void displayFailure() {
  matrix.loadSequence(LEDMATRIX_ANIMATION_BLINK);
  matrix.play(true);
}

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
    case STATE_WIFI_DISCONNECTED:
      displayDisconnected();
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
    setState(STATE_WIFI_DISCONNECTED);
  }
}

// Workerへのハートビート送信
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    setState(STATE_WIFI_DISCONNECTED);
    return;
  }

  Serial.println("Sending heartbeat check...");
  httpClient.get("/");

  int statusCode = httpClient.responseStatusCode();
  String response = httpClient.responseBody();

  Serial.print("Status code: ");
  Serial.println(statusCode);
  Serial.print("Response: ");
  Serial.println(response);

  if (statusCode == 200) {
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

  // Initialize LED Matrix
  matrix.begin();

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
