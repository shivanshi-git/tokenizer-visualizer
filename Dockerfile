# Stage 1: Build the React application
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the dependency definitions
COPY package.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the production bundle (generates files in /app/dist)
RUN npm run build

# Stage 2: Serve the static files using Nginx
FROM nginx:alpine

# Copy custom built assets from builder stage into Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 (default Nginx port)
EXPOSE 80

# Run Nginx in the foreground so the container stays active
CMD ["nginx", "-g", "daemon off;"]
