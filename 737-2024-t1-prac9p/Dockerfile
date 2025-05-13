# Use the official Node.js 18 Alpine image 
FROM node:18-alpine

# Set the working directory inside the container to /app
WORKDIR /app  

# Copy package.json and package-lock.json to the container
COPY package*.json ./  

# Install dependencies defined in package.json
RUN npm install  

# Copy the rest of the application code into the container
COPY . .  

# Expose port 3000 so it can be accessed from outside the container
EXPOSE 4000 

# Define the default command to run the app
CMD ["node", "index.js"]
