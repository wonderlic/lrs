'use strict';

var
    http = require('http'),
    koa = require('koa'),
    auth = require('koa-basic-auth'),
    logger = require('koa-logger'),
    route = require('koa-route'),
    compress = require('koa-compress'),
    cors = require('./middlewares/cors'),
    constants = require('./constants'),
    aboutRouteHandler = require('./routeHandlers/about'),
    statementsRouteHandler = require('./routeHandlers/statements'),
    resultsRouteHandler = require('./routeHandlers/results'),
    insertRouteHandler = require('./routeHandlers/insert'),
	
    VERSION = '1.0.2';

var app = koa();

app.use(compress());

app.use(cors);

app.use(logger());

if (process.env.AUTH_USER && process.env.AUTH_PASSWORD) {
    app.use(function *(next){
        try {
            yield next;
        } catch (err) {
            if (401 == err.status) {
                this.status = 401;
                this.set('WWW-Authenticate', 'Basic');
                this.body = 'Unauthorized';
            } else {
                throw err;
            }
        }
    });

    app.use(auth({name: process.env.AUTH_USER, pass: process.env.AUTH_PASSWORD}));
}

app.use(route.get('/xAPI/about', aboutRouteHandler));

app.use(function*(next) {
    var header = 'X-Experience-API-Version';

    if (this.get(header) && this.get(header).substring(0, 3) === VERSION.substring(0, 3)) {
        yield next;
    }
    else {
        this.body = 'Invalid \'X-Experience-API-Version\' header was supplied';
        this.status = 400;
    }

    this.set(header, VERSION);
});

app.use(route.get('/xAPI/statements', statementsRouteHandler));

app.use(route.get('/xAPI/results', resultsRouteHandler));

app.use(route.post('/xAPI/statements', insertRouteHandler));

var server = http.createServer(app.callback());
server.setTimeout(constants.socketLifetime);
server.listen(process.env.PORT || 3000, process.env.IP);