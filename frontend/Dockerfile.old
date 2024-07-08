# Use official Node.js runtime as parent image -- referencing as `build` so that the backend may reference this frontend build when serving
FROM node:latest AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build frontend by calling on webpack -- output: /app/build
RUN npm run build