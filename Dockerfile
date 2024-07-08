# Build frontend using official node image
FROM node:latest AS frontend-build

# Set the working directory for the frontend build stage
WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend code
COPY frontend .

# Build the frontend
RUN npm run build

# -------- #

# Build backend using official Golang image
FROM golang:latest AS backend-build

# Set the working directory for the backend build stage
WORKDIR /app/backend

# Copy the Go module manifests
COPY backend/go.mod backend/go.sum ./

# Install backend dependencies
RUN go mod download

# Copy the rest of the backend code
COPY backend .

# Build the backend
RUN go build -o main .

# Last stage needs Go image redefined for production image
FROM golang:latest

# Set the working directory for the final image
WORKDIR /app

# Copy built frontend from frontend-build stage
COPY --from=frontend-build /app/frontend/build /app/frontend/build

# Copy built backend from backend-build stage
COPY --from=backend-build /app/backend/main /app/main

# Expose backend port
EXPOSE 8085

# Set environment variables for Redis (if needed)
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

# Command to start the backend
CMD ["./main"]