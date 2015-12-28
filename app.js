'use strict';

var
    koa = require('koa'),
    logger = require('koa-logger'),
    route = require('koa-route'),
    cors = require('koa-cors'),
    compress = require('koa-compress'),
    aboutRouteHandler = require('./routes/about'),
    statementsRouteHandler = require('./routes/statements'),
    resultsRouteHandler = require('./routes/results'),
    insertRouteHandler = require('./routes/insert'),
	
    VERSION = '1.0.2';

var app = koa();

app.use(compress());
app.use(cors({
		headers: 'x-experience-api-version,accept,authorization,content-type,If-Match,If-None-Match'
    }
));
app.use(logger());

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

app.listen(process.env.PORT, process.env.IP);