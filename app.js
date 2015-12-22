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
    var
        criteria = {},
        query = this.request.query || {};

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
        var criteria = {};
        var defaultLimit = 2000;
        var specifiedLimit;
        var defaultSkip = 0;
        var specifiedSkip;
		
		var groupRootStatements = false;
		var loadEmbededStatements = false;
		var objectId = {};
		
		var statementsVerbs = {
			started: "http://adlnet.gov/expapi/verbs/launched",
			passed: "http://adlnet.gov/expapi/verbs/passed",
			failed: "http://adlnet.gov/expapi/verbs/failed",
			mastered: "http://adlnet.gov/expapi/verbs/mastered",
			answered: "http://adlnet.gov/expapi/verbs/answered"
		}

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
				objectId[prop] = query[prop];
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
			
			if (prop === 'group') {
				groupRootStatements = true;
			}
			
			if (prop === 'embeded') {
				loadEmbededStatements = true;
			}
        }
		
		var statements;
		
		if (groupRootStatements) {
			statements = yield dbConfig.query(db.collection('statements'), 'aggregate', [[
				{
					$match: { $and: [
						objectId,
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
				{ $skip: specifiedSkip || defaultSkip },
				{ $limit: specifiedLimit || defaultLimit },
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
		} else {
			statements = yield dbConfig.query(db.collection('statements'), 'find', [criteria, { limit: specifiedLimit, skip: specifiedSkip, sort: { timestamp: -1 }, fields : { _id: 0 } }], true);
		}
        
        if (statements) {
            this.status = 200;
            this.body = { statements: statements };
        }
    }
}));

app.use(route.post('/xAPI/statements', function*(next) {
    yield dbConfig.query(db.collection('statements'), 'insert', [yield parse(this)]);
    this.status = 200;
}));

dbConfig.connect().then(function(_db){
	db = _db;
	app.listen(process.env.PORT, process.env.IP);
});