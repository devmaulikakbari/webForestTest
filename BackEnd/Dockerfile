# use node version
FROM node:16

# Set working directory
WORKDIR /user/src/app

#copy package.json
COPY package*.json ./

# npm package install
RUN npm install

#Bundle app source
COPY . .

# Expose the port 
EXPOSE 5000

# Defined command to run the app
CMD [ "npm", "run", "start"]