FROM node:22-bookworm

WORKDIR /usr/src/app

# Dev tools
RUN apt-get update && apt-get install -y git curl nano build-essential python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy everything including config
COPY . .

# Install OpenClaw globally
RUN npm install -g openclaw@latest

# Expose ports
EXPOSE 3000 18789 5000

# Start OpenClaw agent
CMD ["openclaw", "agent", "run"]