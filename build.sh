#!/bin/bash
# Navigate to the frontend dir to build up frontend with webpack
cd frontend
npm run build &
cd ../backend

# Set GOARCH and GOOS for cross-compilation (since it is running on a linux server)
export GOARCH=amd64
export GOOS=linux

# Navigate to backend dir and create the binary executable (by default named after project root dir -- "word-roulette_go")
go build -o word-roulette_go .