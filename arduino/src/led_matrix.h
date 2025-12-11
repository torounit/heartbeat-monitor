#ifndef LED_MATRIX_H
#define LED_MATRIX_H

#include <Arduino.h>
#include <Arduino_LED_Matrix.h>

// LED Matrix instance
extern ArduinoLEDMatrix matrix;

// Function declarations
void initLedMatrix();
void displayConnecting();
void displayConnected();
void displayDisconnected();
void displayFailure();

const uint32_t LEDMATRIX_ANIMATION_BLINK[][4] = {
  {
		0xffffffff,
		0xffffffff,
		0xffffffff,
		500
	},
	{
		0x0,
		0x0,
		0x0,
		500
	}
};

#endif // LED_MATRIX_H
