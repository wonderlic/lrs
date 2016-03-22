'use strict';

var 
    db = require("../db"),
    constants = require("../constants");

module.exports = {
    execute: function(registration) {
        return db.statements.aggregate([
            {
                $match: { $and: [
                    { "context.registration": registration },
                    { $or: [
                        {
                            'verb.id': { $in: [
                                constants.statementsVerbs.mastered,
                                constants.statementsVerbs.answered,
                                constants.statementsVerbs.experienced
                            ] }
                        },
                        {
                            $and: [
                                { 'verb.id': constants.statementsVerbs.progressed },
                                { 'object.definition.type': constants.activityTypes.objective }
                            ]
                        }]
                    }
                ]}
            },
            {
                $group: {
                    _id: "$verb.id", statements: { $push: "$$ROOT" }
                }
            }
        ]);
    }
}