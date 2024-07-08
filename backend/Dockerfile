# Use official Golang image as a parent image
FROM golang:latest

# Set the working directory in the container
WORKDIR /app

# Copy the Go module manifests
COPY go.mod go.sum ./

# Install the dependencies
RUN go mod download

# Copy the rest of the backend code
COPY . .

# Build the Go application
RUN go build -o main .

# Expose port 8085
EXPOSE 8085

# Set the environment variables for Redis
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

# Run the Go app
CMD ["./main"]