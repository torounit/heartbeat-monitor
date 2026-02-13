from arduino.app_utils import *
import requests

def get_status():
    try:
        response = requests.get("https://example.com/", timeout=10)
        if response.ok:
            return "Good"
    except requests.RequestException:
        pass
    return "Unhealthy"

Bridge.provide("get_air_quality", get_status)
App.run()
