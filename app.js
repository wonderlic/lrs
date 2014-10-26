var
    koa = require('koa'),
    logger = require('koa-logger'),
    route = require('koa-route'),
    parse = require('co-body'),
    mongo = require('koa-mongo'),
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


app.use(mongo({
    host: process.env.IP,
    log: true
}));

app.use(route.get('/xAPI/statements', function*() {
    var context = this;
    this.mongo.db('lrs').collection('statements').find({}).toArray(function(err, doc) {
        context.body = doc;
    });
}));


app.use(route.put('/xAPI/statements', function*(next) {
    var context = this;
    this.mongo.db('lrs').collection('statements').insert(yield parse(this), function(err, doc) {
            if (!err){
                    context.status = 204;
            }
        }
    );
}));


app.listen(process.env.PORT, process.env.IP);
