'use strict';

var 
	_ = require('underscore'),
    queryParser = require("../queryParser"),
	db = require("../db"),
    constants = require("../constants");

module.exports = function*() {
    var query = this.request.query || {};
    var loadEmbededStatements = query.embeded;
    var options = queryParser.generateOptions(query, constants.defaultLimit, constants.defaultSkip);
    
    var statements = yield db.statements.aggregate([
        {
            $match: { $and: [
                options.objectId,
                { $or: [
                    {
                        $and: [{ "verb.id": constants.statementsVerbs.started }, { "context.registration": { $exists: true } }]
                    },
                    { "verb.id": { $in: [constants.statementsVerbs.passed, constants.statementsVerbs.failed] } }
                ]}
            ]}
        },
        { $project: { attemptId: { $ifNull: ["$context.registration", "$_id"] }, statement: "$$ROOT" } },
        { $group: { _id: "$attemptId", date: { $min: "$statement.timestamp" }, root: { $push: "$$ROOT.statement" } } },
        { $sort: { date: -1 } },
        { $skip: options.specifiedSkip || constants.defaultSkip },
        { $limit: options.specifiedLimit || constants.defaultLimit },
        { $project: { _id: 0, root: 1 } }
    ]);
    
    if(loadEmbededStatements){
        yield* (function* (results) {
            for (var i = 0; i < results.length; i ++) {
                var rootContext = results[i].root[0].context;
                if(!rootContext || !rootContext.registration){
                    continue;
                }
                var embededStatements = yield db.statements.aggregate([
                    {
                        $match: { $and: [
                            { "context.registration": rootContext.registration },
                            { "verb.id": { $in: [constants.statementsVerbs.mastered, constants.statementsVerbs.answered] } }
                        ]}
                    },
                    {
                        $group: {
                            _id: "$verb.id", statements: { $push: "$$ROOT" }
                        }
                    }
                ]);
                if(!embededStatements || !embededStatements.length){
                    continue;
                }
                
                var mastered = _.find(embededStatements, function(statement){
                    return statement._id === constants.statementsVerbs.mastered;
                }),
                    answered = _.find(embededStatements, function(statement){
                    return statement._id === constants.statementsVerbs.answered;
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
}