#ifndef CONFIG_H
#define CONFIG_H

// Worker endpoint for heartbeat check
const char* WORKER_HOSTNAME = "heartbeat-monitor.torounit.workers.dev";

// WiFi connection timeout in seconds
const unsigned long WIFI_TIMEOUT_SECONDS = 10;

// WiFi reconnect interval in seconds
const unsigned long WIFI_RECONNECT_INTERVAL_SECONDS = 10;

// LED blink interval for failure state (milliseconds)
const unsigned long LED_BLINK_INTERVAL_MS = 1000;

#endif
