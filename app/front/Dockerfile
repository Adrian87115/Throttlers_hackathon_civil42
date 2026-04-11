# ./app/front/Dockerfile
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (for faster rebuilds)
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install react-calendar

# Copy the rest of the app
COPY . .

# Expose React dev server port
EXPOSE 3000

# Default command for development
CMD ["npm", "start"]
