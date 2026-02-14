// SPDX-FileCopyrightText: Copyright (C) ARDUINO SRL (http://www.arduino.cc)
//
// SPDX-License-Identifier: MPL-2.0

#include <Arduino_LED_Matrix.h>
#include <Arduino_RouterBridge.h>

#include "faces.h"

Arduino_LED_Matrix matrix;

void setup() {
  matrix.begin();
  matrix.clear();
  Bridge.begin();
}

void loop() {
  String status;
  bool ok = Bridge.call("get_status").result(status);
  if (ok) {
    if (status == "Good") {
      matrix.loadFrame(good);
    } else {
      matrix.loadFrame(unhealthy);
    }
  }
  delay(30000);
}
