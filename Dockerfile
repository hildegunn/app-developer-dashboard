FROM node:argon

#RUN useradd -ms /bin/bash node
#ENV HOME /home/node#

RUN mkdir -p /app
#RUN chown node /app
#USER node


# Create app directory

WORKDIR /app
RUN mkdir -p /app/app/dist

# Install app dependencies
COPY package.json /app/
RUN npm install

#COPY app/etc/config.template.js app/etc/config.js

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



# RUN ls -la /app
# RUN ls -la /app/app
# RUN ls -la /app/app/etc



#RUN chown -R node /app 
RUN node_modules/grunt-cli/bin/grunt build
COPY dataporten-resources/fonts bower_components/uninett-bootstrap-theme/fonts

EXPOSE 8091
CMD [ "npm", "start" ]

