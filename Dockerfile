# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (no need for dev dependencies since we're using the JS file directly)
RUN npm install --only=production

# Copy source code and configuration
COPY . .

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the corrected server
CMD ["node", "corrected-bolt2api.js"]
