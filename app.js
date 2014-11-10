var
    koa = require('koa'),
    logger = require('koa-logger'),
    route = require('koa-route'),
    cors = require('koa-cors'),
    compress = require('koa-compress'),
    parse = require('co-body'),
    db = require("./db/db"),
    VERSION = '1.0.2';

var app = koa();

app.use(compress());
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
    var query = this.request.query || {};

    if (query.statementId) {
        if (Object.keys(query).length !== 1) {
            this.status = 400;
            this.body = 'You can not supply other params along with statementId';
            return;
        }
        else {
            var statement = yield db.statements.findOne({ id: query.statementId });
            if (statement) {
                this.status = 200;
                this.body = statement;
            }
        }
    }
    else {
        var criteria = {};

        if (query.verb) {
            criteria['verb.id'] = query.verb;
        }

        if (query.activity) {
            criteria['object.id'] = query.activity;
        }
        
        if (query.registration) {
            criteria['context.registration'] = query.registration;
        }
        
        var statements = yield db.statements.find(criteria);
        if (statements) {
            this.status = 200;
            this.body = statements;
        }
    }
}));


app.use(route.put('/xAPI/statements', function*(next) {
    yield db.statements.insert(yield parse(this));
    this.status = 204;
}));

app.use(route.post('/xAPI/statements', function*(next) {
    yield db.statements.insert(yield parse(this));
    this.status = 204;
}));

app.listen(process.env.PORT, process.env.IP);
