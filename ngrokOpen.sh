#!/bin/bash

# Start ngrok for HTTP server first
ngrok http 8085 &

# Buffer for ngrok to start and extract HTTP URL, using jq to parse JSON
sleep 2
ngrok_http_url=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

# Set ngrok URLS as envs
export NGROK_HTTP="$ngrok_http_url"

echo "HTTP URL: $NGROK_HTTP"