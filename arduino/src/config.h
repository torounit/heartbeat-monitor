#ifndef CONFIG_H
#define CONFIG_H

// WiFi connection timeout in seconds
const unsigned long WIFI_TIMEOUT_SECONDS = 10;

// WiFi reconnect interval in seconds
const unsigned long WIFI_RECONNECT_INTERVAL_SECONDS = 10;

// Heartbeat send interval in seconds
const unsigned long HEARTBEAT_INTERVAL_SECONDS = 30;

// Automatic reboot interval in seconds
const unsigned long AUTO_REBOOT_INTERVAL_SECONDS = 3600;

// Reboot if not successful for this duration in seconds
const unsigned long FAILURE_REBOOT_TIMEOUT_SECONDS = 300;

#endif
