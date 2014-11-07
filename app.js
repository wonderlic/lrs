var
    koa = require('koa'),
    logger = require('koa-logger'),
    route = require('koa-route'),
    cors = require('koa-cors'),
    parse = require('co-body'),
    mongo = require('koa-mongo'),


    statements = require('./api/statements'),

    VERSION = '1.0.2';

var app = koa();

app.use(cors());
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
    var that = this;
    yield statements.get().then(function(statements) {
        if (statements) {
            that.body = statements;
        }
    });
}));


app.use(route.put('/xAPI/statements', function*(next) {
    var that = this;
    yield statements.add(
        yield parse(that)).then(function() {
        that.status = 204;
    });
}));

app.use(route.post('/xAPI/statements', function*(next) {
    var that = this;
    yield statements.add(
        yield parse(that)).then(function() {
        that.status = 204;
    });
}));


app.listen(process.env.PORT, process.env.IP);
