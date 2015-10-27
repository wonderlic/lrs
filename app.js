'use strict'

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
app.use(cors({
    headers: 'x-experience-api-version,accept,authorization,content-type,If-Match,If-None-Match',
    }
));
app.use(logger());


app.use(route.get('/xAPI/about', function*() {
    this.body = {
        version: '1.0.2'
    };
    this.status = 200;
}));

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

app.use(route.get('/xAPI/statements', function*() {
    var
        criteria = {},
        query = this.request.query || {};

    if (query.statementId) {
        if (Object.keys(query).length !== 1) {
            this.body = 'You can not supply other params along with statementId';
            this.status = 400;
        }
        else {
            var statement =
                yield db.statements.findOne({
                    id: query.statementId
                });
            if (statement) {
                this.body = statement;
                this.status = 200;
            }
        }
    }
    else {

        var criteria = {};
        var defaultLimit = 2000;
        var specifiedLimit;
        var defaultSkip = 0;
        var specifiedSkip;

        for (var prop in query) {

            if (prop === 'limit') {
                specifiedLimit = parseInt(query.limit, 10);
                if (isNaN(specifiedLimit) || specifiedLimit < 1) {
                  specifiedLimit = defaultLimit;
                }
            }

            if (prop === 'skip') {
                specifiedSkip = parseInt(query.skip, 10);
                if (isNaN(specifiedSkip) || specifiedLimit < 0) {
                  specifiedSkip = defaultSkip;
                }
            }
            
            if (prop === 'verb') {
                var verbs = query.verb.split(',')
                if (verbs.length === 1) {
                    criteria['verb.id'] = verbs[0];
                } else if (verbs.length > 1) {
                    criteria['verb.id'] = { $in: verbs };
                }
            }

            if (prop === 'activity') {
                criteria['object.id'] = query.activity;
            }

            if (prop === 'registration') {
				var registrations = query.registration.split(',');
				if (registrations.length === 1) {
                    criteria['context.registration'] = registrations[0];
                } else if (registrations.length > 1) {
                    criteria['context.registration'] = { $in: registrations };
                }
            }

            if (prop.indexOf('context.extensions.') === 0) {
                criteria[prop] = query[prop];
            }

            if (prop === 'agent') {
                query.agent = JSON.parse(query.agent);
                if (query.agent.objectType === 'Agent') {
                  var actorMailToIRI = query.agent.mbox;
                  if (actorMailToIRI.indexOf('mailto:') !== 0) {
                    actorMailToIRI = 'mailto:' + actorMailToIRI;
                  }
                  criteria['actor.mbox'] = actorMailToIRI;
                }
            }

            if (prop === 'parent') {
                criteria['context.contextActivities.parent.id'] = query.parent;
            }
        }

        var statements = yield db.statements.find(criteria, { limit: specifiedLimit, skip: specifiedSkip, sort: { timestamp: -1 }, fields : { _id: 0 } });
        if (statements) {
            this.status = 200;
            this.body = { statements: statements };
        }
    }
}));

app.use(route.post('/xAPI/statements', function*(next) {
    yield db.statements.insert(yield parse(this));
    this.status = 200;
}));

app.listen(process.env.PORT, process.env.IP);
