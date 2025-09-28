# Stage 1: Build the frontend assets
FROM node:lts-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Production image
FROM node:lts-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the server source code and pm2 config
COPY src/server/server.js ./src/server/server.js
COPY ecosystem.config.js .
COPY .env .

# Install pm2 globally
RUN npm install pm2 -g

# Expose the port the app runs on
EXPOSE 3001

# Start the application using pm2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]