#include "led_matrix.h"

// LED Matrix instance
ArduinoLEDMatrix matrix;

void initLedMatrix() {
  matrix.begin();
}

void displayConnecting() {
  matrix.loadSequence(LEDMATRIX_ANIMATION_WIFI_SEARCH);
  matrix.play(true);
}

void displayConnected() {
  matrix.loadSequence(LEDMATRIX_ANIMATION_HEARTBEAT_LINE);
  matrix.play(true);
}

void displayDisconnected() {
  matrix.loadSequence(LEDMATRIX_ANIMATION_BOUNCING_BALL);
  matrix.play(true);
}

void displayFailure() {
  matrix.loadSequence(LEDMATRIX_ANIMATION_BLINK);
  matrix.play(true);
}
