# Use a lightweight Node.js version based on Debian (allows apt-get)
FROM node:18-bullseye-slim

# 1. Install LibreOffice and fonts
# We use --no-install-recommends to keep the size small for the free tier
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice-core \
    libreoffice-writer \
    libreoffice-java-common \
    default-jre \
    fonts-liberation \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files first (better caching)
COPY package*.json ./

# 4. Install Node dependencies
RUN npm install

# 5. Copy the rest of your server code
COPY . .

# 6. Expose the port your app runs on
EXPOSE 5000

# 7. Command to start the server
CMD ["node", "server.js"]