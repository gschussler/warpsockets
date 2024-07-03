#!/bin/bash
# run at project root -- ./devStart.sh

# Start the Redis server (current path is localhost:6379, so use default)
redis-server &

# Start the Go server from the executable in /backend
cd backend
./word-roulette_go &

# Navigate back a step and to the frontend dir to start frontend dev server
cd ../frontend
npm run dev