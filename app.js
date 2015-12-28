'use strict';

var
    koa = require('koa'),
    logger = require('koa-logger'),
    route = require('koa-route'),
    cors = require('koa-cors'),
    compress = require('koa-compress'),
    parse = require('co-body'),
	_ = require('underscore'),
    dbConfig = require("./db/db"),
    queryParser = require("./queryParser"),
	db,
	
    VERSION = '1.0.2';

var app = koa();

app.use(compress());
app.use(cors({
		headers: 'x-experience-api-version,accept,authorization,content-type,If-Match,If-None-Match'
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
    var query = this.request.query || {};

    if (query.statementId) {
        if (Object.keys(query).length !== 1) {
            this.body = 'You can not supply other params along with statementId';
            this.status = 400;
        }
        else {
            var statement = yield dbConfig.query(db.collection('statements'), 'findOne', {
                id: query.statementId
            });
            if (statement) {
                this.body = statement;
                this.status = 200;
            }
        }
    }
    else {
        var defaultLimit = 2000;
        var defaultSkip = 0;
        var options = queryParser.generateOptions(query, defaultLimit, defaultSkip);
       
        var statements = yield dbConfig.query(db.collection('statements'), 'find', [options.criteria, { limit: options.specifiedLimit, skip: options.specifiedSkip, sort: { timestamp: -1 }, fields : { _id: 0 } }], true);
        
        if (statements) {
            this.status = 200;
            this.body = { statements: statements };
        }
    }
}));

app.use(route.get('/xAPI/statements/grouped', function*() {
    var query = this.request.query || {};
    var loadEmbededStatements = query.embeded;
    var defaultLimit = 2000;
    var defaultSkip = 0;
    var options = queryParser.generateOptions(query, defaultLimit, defaultSkip);
    
    var statementsVerbs = {
        started: "http://adlnet.gov/expapi/verbs/launched",
        passed: "http://adlnet.gov/expapi/verbs/passed",
        failed: "http://adlnet.gov/expapi/verbs/failed",
        mastered: "http://adlnet.gov/expapi/verbs/mastered",
        answered: "http://adlnet.gov/expapi/verbs/answered"
    }
    
    var statements = yield dbConfig.query(db.collection('statements'), 'aggregate', [[
        {
            $match: { $and: [
                options.objectId,
                { $or: [
                    {
                        $and: [{ "verb.id": statementsVerbs.started }, { "context.registration": { $exists: true } }]
                    },
                    { "verb.id": { $in: [statementsVerbs.passed, statementsVerbs.failed] } }
                ]}
            ]}
        },
        { $project: { attemptId: { $ifNull: ["$context.registration", "$_id"] }, statement: "$$ROOT" } },
        { $group: { _id: "$attemptId", date: { $min: "$statement.timestamp" }, root: { $push: "$$ROOT.statement" } } },
        { $sort: { date: -1 } },
        { $skip: options.specifiedSkip || defaultSkip },
        { $limit: options.specifiedLimit || defaultLimit },
        { $project: { _id: 0, root: 1 } }
    ]]);
    
    if(loadEmbededStatements){
        yield* (function* (results) {
            for (var i = 0; i < results.length; i ++) {
                var rootContext = results[i].root[0].context;
                if(!rootContext || !rootContext.registration){
                    continue;
                }
                var embededStatements = yield dbConfig.query(db.collection('statements'), 'aggregate', [[
                    {
                        $match: { $and: [
                            { "context.registration": rootContext.registration },
                            { "verb.id": { $in: [statementsVerbs.mastered, statementsVerbs.answered] } }
                        ]}
                    },
                    {
                        $group: {
                            _id: "$verb.id", statements: { $push: "$$ROOT" }
                        }
                    }
                ]]);
                if(!embededStatements || !embededStatements.length){
                    continue;
                }
                
                var mastered = _.find(embededStatements, function(statement){
                    return statement._id === statementsVerbs.mastered;
                }),
                    answered = _.find(embededStatements, function(statement){
                    return statement._id === statementsVerbs.answered;
                });
                if(!mastered || !mastered.statements){
                    continue;
                }
                
                results[i].embeded = _.map(_.sortBy(mastered.statements, function(item){ return -item.timestamp; }), function(statement){
                    return {
                        mastered: statement,
                        answered: _.sortBy(_.filter(answered.statements, function(element) {
                            try {
                                return _.some(element.context.contextActivities.parent, function(item){ return item.id === statement.object.id; });
                            } catch(e) {
                                return false;
                            }
                        }), function(item){ return -item.timestamp; })
                    };
                });
            }
        })(statements);
    }
    
    if (statements) {
        this.status = 200;
        this.body = { statements: statements };
    }
}));

app.use(route.post('/xAPI/statements', function*(next) {
    yield dbConfig.query(db.collection('statements'), 'insert', [yield parse(this)]);
    this.status = 200;
}));

dbConfig.connect().then(function(_db) {
	db = _db;
	app.listen(process.env.PORT, process.env.IP);
});