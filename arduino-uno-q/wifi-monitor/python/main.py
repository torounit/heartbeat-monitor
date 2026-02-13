from arduino.app_utils import *
import requests
from dotenv import load_dotenv
load_dotenv()

import os

CF_ACCESS_CLIENT_ID = os.getenv('CF_ACCESS_CLIENT_ID')
CF_ACCESS_CLIENT_SECRET = os.getenv('CF_ACCESS_CLIENT_SECRET')
WORKER_HOSTNAME = os.getenv('WORKER_HOSTNAME')

def get_status():
    try:
        print("Checking internet connectivity...")
        response = requests.get(f"https://{WORKER_HOSTNAME}/", timeout=5, headers={
            "CF-Access-Client-Id": CF_ACCESS_CLIENT_ID,
            "CF-Access-Client-Secret": CF_ACCESS_CLIENT_SECRET,
        })
        if response.ok:
            return "Good"
    except requests.RequestException as e:
        print(f"No internet connectivity. {e}")
    return "Unhealthy"

Bridge.provide("get_status", get_status)
App.run()
