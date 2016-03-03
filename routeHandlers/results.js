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
                            { "verb.id": 
                                { $in: [
                                    constants.statementsVerbs.mastered, 
                                    constants.statementsVerbs.answered,
                                    constants.statementsVerbs.experienced                                   
                                ] } }
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
                
                var masteredGroup =  findStatementGroupById(embededStatements, constants.statementsVerbs.mastered),
                    answeredGroup = findStatementGroupById(embededStatements, constants.statementsVerbs.answered),
                    experiencedGroup = findStatementGroupById(embededStatements, constants.statementsVerbs.experienced);

                if(!masteredGroup || !masteredGroup.statements){
                    continue;
                }
                
                results[i].embeded = _.map(_.sortBy(masteredGroup.statements, function(item){ return -item.timestamp; }), function(statement){
                    return {
                        mastered: statement,
                        answered: mapChildStatements(answeredGroup, statement),
                        experienced: mapChildStatements(experiencedGroup, statement)
                    };
                });
                
                function mapChildStatements(statementGroup, parentStatement){                   
                    return statementGroup && statementGroup.statements ? _.sortBy(_.filter(statementGroup.statements, function(element) {
                            try {
                                return _.some(element.context.contextActivities.parent, function(item){ return item.id === parentStatement.object.id; });
                            } catch(e) {
                                return false;
                            }
                        }), function(item){ return -item.timestamp; }) : null;
                }
                
                function findStatementGroupById(embededStatements, id){
                    return _.find(embededStatements, function(statement){
                        return statement._id === id;
                    });
                }
            }
        })(statements);
    }
    
    if (statements) {
        this.status = 200;
        this.body = { statements: statements };
    }
}