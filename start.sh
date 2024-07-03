# Start the Redis server (current path is localhost:6379, so use default)
redis-server &

# Start the Go server using the created binary
cd backend
./word-roulette_go