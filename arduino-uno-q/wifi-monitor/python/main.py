from arduino.app_utils import *
import requests
import time
from dotenv import load_dotenv
load_dotenv()

import os

CF_ACCESS_CLIENT_ID = os.getenv('CF_ACCESS_CLIENT_ID')
CF_ACCESS_CLIENT_SECRET = os.getenv('CF_ACCESS_CLIENT_SECRET')
WORKER_HOSTNAME = os.getenv('WORKER_HOSTNAME')
DEVICE_NAME = os.getenv('DEVICE_NAME')

def get_status():
    try:
        print("Checking internet connectivity...")
        print(f"Posting to https://{WORKER_HOSTNAME}/api/heartbeat")
        print(f"Using Device Name: {DEVICE_NAME}")
        print(f"Current Time: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}")
        response = requests.post(
            f"https://{WORKER_HOSTNAME}/api/heartbeat",
            json={"device": f"{DEVICE_NAME}"},
            timeout=15,
            headers={
              "CF-Access-Client-Id": CF_ACCESS_CLIENT_ID,
              "CF-Access-Client-Secret": CF_ACCESS_CLIENT_SECRET,
              "Content-Type": "application/json"
            }
        )
        print(f"Received status code: {response.status_code}")
        if response.ok:
            response_json = response.json()
            print(f"Received response: {response_json}")
            return "Good"
    except requests.RequestException as e:
        print(f"Error:{e}")
    return "Unhealthy"

Bridge.provide("get_status", get_status)

App.run()
