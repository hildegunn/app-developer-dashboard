FROM node:argon

RUN mkdir -p /app

# Create app directory

WORKDIR /app
RUN mkdir -p /app/app/dist

# Install app dependencies
COPY package.json /app/
RUN npm install

COPY bower.json .
COPY build.css.js .
COPY build.js .
COPY Gruntfile.js .
COPY .jshintrc .
COPY app app
COPY js js
COPY lib lib
COPY server.js .
COPY config.js .

# These are only needed for building not for running. Can be cleaned afterwards.
COPY css css
COPY dictionaries dictionaries
COPY templates templates

RUN node_modules/grunt-cli/bin/grunt build
COPY dataporten-resources/fonts bower_components/uninett-bootstrap-theme/fonts

EXPOSE 8091
CMD [ "node", "server.js" ]

