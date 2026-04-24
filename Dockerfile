FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (ensure prisma is in your package.json devDependencies)
RUN npm install

# Copy the prisma folder and the rest of the source
COPY prisma ./prisma/
COPY . .

EXPOSE 3000

# We move npx prisma generate to the compose command to run at startup