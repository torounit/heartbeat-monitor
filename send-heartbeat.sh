#!/bin/bash
# ハートビート送信
curl -X POST \
  -H "CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}" \
  -H "CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}" \
  -H "Content-Type: application/json" \
  -d "{\"device\":\"${DEVICE_NAME}\"}" \
  "${API_URL}"
