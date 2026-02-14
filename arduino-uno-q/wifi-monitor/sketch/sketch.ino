// SPDX-FileCopyrightText: Copyright (C) ARDUINO SRL (http://www.arduino.cc)
//
// SPDX-License-Identifier: MPL-2.0
#include <ArduinoGraphics.h>
#include <Arduino_LED_Matrix.h>
#include <Arduino_RouterBridge.h>

#include "faces.h"
#include "animation.h"

Arduino_LED_Matrix matrix;

void setup() {
  pinMode(LED3_R, OUTPUT);
  pinMode(LED3_G, OUTPUT);
  pinMode(LED3_B, OUTPUT);
  matrix.begin();
  matrix.textFont(Font_5x7);
  matrix.textScrollSpeed(50);
  matrix.clear();
	Serial.begin(115200);
  Bridge.begin();
  digitalWrite(LED3_R, LOW);
  digitalWrite(LED3_G, LOW);
  digitalWrite(LED3_B, LOW);
}

void loop() {
  String status;
  bool ok = Bridge.call("get_status").result(status);
  if (ok) {
    if (status == "Good") {
      digitalWrite(LED3_R, HIGH);
      digitalWrite(LED3_G, LOW);
      digitalWrite(LED3_B, HIGH);
      matrix.loadFrame(good);
      delay(30000);
    } else {
      digitalWrite(LED3_R, LOW);
      digitalWrite(LED3_G, HIGH);
      digitalWrite(LED3_B, HIGH);
      matrix.beginText(13, 0, 127, 0, 0);
      matrix.print("Wi-Fi Disconnected !!! Wi-Fi Disconnected !!!");
      matrix.endText(SCROLL_LEFT);
    }
  }

}
