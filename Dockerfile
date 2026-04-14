FROM node:25.9-alpine3.22

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Use a standard workdir
WORKDIR /usr/src/app

# Copy package manifests first for cached installs
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Install postgres client for pg_isready used in startup script
RUN apk add --no-cache postgresql-client

# Copy the rest of the application code
COPY . .

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /usr/src/app

# Ensure startup script is executable
RUN chmod +x ./startup.sh

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 3000

ENTRYPOINT ["./startup.sh"]
