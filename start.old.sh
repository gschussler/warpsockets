#!/bin/bash
# run at project root -- ./devStart.sh
# Navigate to the frontend dir to build up frontend with webpack
cd frontend
npm run build &
cd ..

# Start the Redis server (current path is localhost:6379, so use default)
redis-server &

# Navigate to backend dir and start the Go server using the created binary
cd backend
go build &
./word-roulette_go