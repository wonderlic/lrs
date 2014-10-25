var
    koa = require('koa'),
    logger = require('koa-logger'),
    route = require('koa-route'),
    parse = require('co-body'),

    statements = require('./api/statements'),


    VERSION = '1.0.2';


var app = koa();

app.use(logger());


app.use(route.get('/xAPI/about', function*() {
    this.body = {
        version: '1.0.2'
    };
}));





app.use(function*(next) {
    var header = 'X-Experience-API-Version';
    
    if (this.get(header) && this.get(header).substring(0, 3) === VERSION.substring(0, 3)) {
        yield next;
    }
    else {
        this.status = 400;
        this.body = 'Invalid \'X-Experience-API-Version\' header was supplied';
    }

    this.set(header, VERSION);
});


app.use(route.get('/xAPI/statements', function*() {
    this.body = statements.get();
}));


app.use(route.put('/xAPI/statements', function*(next) {
    if ('PUT' != this.method) {
        return yield next;
    }

    statements.add(yield parse(this))

    this.status = 204;
}));


app.listen(process.env.PORT, process.env.IP);
