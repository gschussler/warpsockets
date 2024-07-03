#!/bin/bash
# Navigate to the frontend dir to build up frontend with webpack
cd frontend
npm run build &
cd ../backend

# Navigate to backend dir and create the binary executable (by default named after project root dir -- "word-roulette_go")
go build .