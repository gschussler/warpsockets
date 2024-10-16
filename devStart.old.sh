#!/bin/bash
# run at project root -- ./devStart.sh

# Start the Redis server (current path is localhost:6379, so use default)
redis-server &

# Navigate to backend dir, build and start the Go server
cd backend
go build &
./word-roulette_go &

# Navigate back a step and to the frontend dir to start frontend dev server
cd ../frontend

#
npm run dev