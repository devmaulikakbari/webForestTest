# use node version
FROM node:16

# Set working directory
WORKDIR /user/src/app

#copy package.json
COPY package*.json ./

# Install npm dependencies, trying different resolution strategies
RUN npm install --verbose --legacy-peer-deps

#Bundle app source
COPY . .

# Expose the port 
EXPOSE 5000

# Defined command to run the app
CMD [ "npm", "run", "start"]