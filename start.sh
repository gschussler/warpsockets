#!/bin/bash
# run at project root -- ./devStart.sh
# Navigate back a step and to the frontend dir to start frontend dev server
cd frontend
npm install &
npm run build &
cd ..

# Start the Redis server (current path is localhost:6379, so use default)
redis-server &

# Navigate to backend dir and start the Go server
cd backend
./word-roulette_go