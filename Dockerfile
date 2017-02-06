FROM wonderlic/nodejs:4.4.5
MAINTAINER Wonderlic DevOps <DevOps@wonderlic.com>

COPY commands /app/commands
COPY db /app/db
COPY helpers /app/helpers
COPY middlewares /app/middlewares
COPY migration /app/migration
COPY node_modules /app/node_modules
COPY routeHandlers /app/routeHandlers
COPY utils /app/utils
COPY app.js /app/app.js
COPY constants.js /app/constants.js
COPY queryParser.js /app/queryParser.js

RUN ln -s /usr/bin/node /app/easygen-lrs

CMD ["/app/easygen-lrs", "/app/app.js"]
