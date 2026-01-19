FROM node:24.8.0-alpine3.22

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

# Ensure startup script is executable
RUN chmod +x ./startup.sh

# Expose the application port
EXPOSE 3000

ENTRYPOINT ["./startup.sh"]
