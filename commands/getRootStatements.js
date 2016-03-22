'use strict';

var 
    db = require("../db"),
    constants = require("../constants");

module.exports = {
    execute: function(objectId, specifiedSkip, specifiedLimit){
        return db.statements.aggregate([
            {
                $match: { $and: [
                    objectId,
                    { $or: [
                        {
                            $and: [{ "verb.id": constants.statementsVerbs.started }, { "context.registration": { $exists: true } }]
                        },
                        {
                            $and: [
                                { "verb.id": constants.statementsVerbs.progressed },
                                { "context.registration": { $exists: true } },
                                { "object.definition.type": constants.activityTypes.course }
                            ]
                        },
                        { "verb.id": { $in: [constants.statementsVerbs.passed, constants.statementsVerbs.failed] } }
                    ]}
                ]}
            },
            { $project: { attemptId: { $ifNull: ["$context.registration", "$_id"] }, statement: "$$ROOT" } },
            { $group: { _id: "$attemptId", date: { $max: "$statement.timestamp" }, root: { $push: "$$ROOT.statement" } } },
            { $sort: { date: -1 } },
            { $skip: specifiedSkip || constants.defaultSkip },
            { $limit: specifiedLimit || constants.defaultLimit },
            { $project: { _id: 0, root: 1 } }
        ]);
    }
} 