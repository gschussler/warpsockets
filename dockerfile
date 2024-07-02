# Build the frontend using Webpack, start the Redis server, then build and start the Go server

# Official Node.js image as base for building the frontend
FROM node:18-alpine AS f-builder

# Install build tools (missing from image it seems)
RUN apk add --no-cache make gcc g++ python3

# Set the working directory inside the container
WORKDIR /app/frontend

# Copy package.json to give reference to `npm install`
COPY frontend/package.json ./

# Install dependencies
RUN npm install

# Copy the source code into the container
COPY frontend/ .

# Build the React frontend
RUN npm run build

# ---

# Official Golang image as the base image for building the backend
FROM golang:1.21-alpine AS b-builder

# Set the working directory inside the container
WORKDIR /app/backend

# Copy go.mod and go.sum files to give reference to dependency downloads
COPY backend/go.mod backend/go.sum ./

# Download dependencies; cached if go.mod and go.sum are unchanged
RUN go mod download

# Copy the source code into the container
COPY backend/ .

# Build the Go server
RUN go build -o main .

# ---

# Create the final stage for the Go and React assets by returning to the root directory of the container
FROM golang:1.21-alpine

WORKDIR /app

# Copy the Go executable from the backend-builder stage
COPY --from=b-builder /app/backend/main .

# Copy the built frontend assets from the frontend-builder stage
COPY --from=f-builder /app/frontend/dist /app/static

# Expose HTTP server
EXPOSE 8085

# Run the executable
CMD ["./main"]