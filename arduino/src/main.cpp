#include <Arduino.h>

void setup()
{
    Serial.begin(115200);
    delay(1000);
    Serial.println("Heartbeat Monitor Started");
}

void loop()
{
    // Add your heartbeat monitoring code here
    delay(1000);
}
