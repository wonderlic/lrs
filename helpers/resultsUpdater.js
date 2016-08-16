'use strict';

var _ = require('underscore'),
    constants = require('../constants'),
    statementsInformer = require('./statementsInformer'),
    command = require('../commands/results');

module.exports = { 
    *update(statement) {
        if(!statementsInformer.isCourseStatement(statement)) { return; }
        var result = null;
        if(statementsInformer.isStarted(statement)) {
            result = yield* command.getAttempt(statement.context.registration);
            if(result) { return; }
            result = createResult(statement);
            yield* command.insert(result);
            return;
        } else if(statementsInformer.isCourseProgressable(statement)) {
            result = yield* command.getAttempt(statement.context.registration);
            if(!result || !result.root) { return; }
            yield* command.pushToRoot(result._id, statement);
            yield* command.markRootAsModified(result._id, statement.timestamp);
        } else if(statementsInformer.isObjectiveProgressable(statement)) {
            result = yield* command.getAttempt(statement.context.registration);
            if(!result) { return; }
            var embeded = result.embeded ? _.find(result.embeded, item => item.objectId === statement.object.id): null;
            if(!embeded) {
                embeded = createEmbededResult(statement);
                var child = yield* command.getChildStatements(statement.context.registration, statement.object.id);
                applyChildStatements(embeded, child);
                yield* command.pushToEmbeded(result._id, embeded);
            } else {
                yield* command.pushToEmbededRoot(result._id, embeded.objectId, statement);
            }
            yield* command.markEmbededAsModified(result._id, embeded.objectId, statement.timestamp);
        } else if(statementsInformer.isAnswered(statement) || statementsInformer.isExperienced(statement)) {
            result = yield* command.getAttempt(statement.context.registration);
            if(!result || !result.embeded) { return; }
            var embeded = _.find(result.embeded, e => _.some(statement.context.contextActivities.parent, parent => parent.id === e.objectId));
            if(!embeded) { return; }
            if(statementsInformer.isAnswered(statement)) {
                yield* command.pushToAnswered(result._id, embeded.objectId, statement);
            } else {
                yield* command.pushToExperienced(result._id, embeded.objectId, statement);
            }
        }
    }
};

function applyChildStatements(source, child) {
    if(!child || !child.length) { return; }
    for(var i = 0; i < child.length; i++) {
        if(statementsInformer.isAnswered(child[i])) {
            source.answered.push(child[i]);
        } else if(statementsInformer.isExperienced(child[i])) {
            source.experienced.push(child[i]);
        }
    }
};

function createResult(startedStatement) {
    return {
        id: startedStatement.context.extensions[constants.courseKey],
        attempt_id: startedStatement.context.registration,
        first_activity: startedStatement.timestamp,
        last_activity: startedStatement.timestamp,
        root: [startedStatement],
        embeded: []
    };
};

function createEmbededResult(objectiveStatement) {
    return {
        objectId: objectiveStatement.object.id,
        last_activity: objectiveStatement.timestamp,
        root: [objectiveStatement],
        answered: [],
        experienced: []
    };
};