'use strict';

var 
    db = require("../db"),
    constants = require("../constants"),
    jsonStream = require("../utils/jsonStream");

var fields = {
    root: 1,
    attempt_id: 1,
    first_activity: 1,
    last_activity: 1
};

module.exports = {
    *getRoot(id, specifiedSkip, specifiedLimit) {
        return yield* this.get(Object.assign({}, fields), id, specifiedSkip, specifiedLimit);
    },
    *getFull(id, specifiedSkip, specifiedLimit) {
        return yield* this.get(Object.assign({ embeded: 1 }, fields), id, specifiedSkip, specifiedLimit);
    },
    *get(fields, id, specifiedSkip, specifiedLimit) {
        var cursor = yield db.results.find({ id }, {
            fields,
            sort: { last_activity: -1 },
            skip: specifiedSkip || constants.defaultSkip,
            limit: specifiedLimit || constants.defaultLimit,
            rawCursor: true
        });
        return cursor.stream().pipe(jsonStream.stringify(transform).apply(this, getJsonStreamWrapperParameters('statements')));
    },
    *getAttempt(attempt_id) {
        return yield db.results.findOne({ attempt_id });
    },
    *getChildStatements(registration, objectId) {
        return yield db.statements.find({
            "context.registration": registration,
            "verb.id": { "$in": [constants.statementsVerbs.answered, constants.statementsVerbs.experienced] },
            "context.contextActivities.parent.id": { "$in": [objectId] }
        });
    },
    *insert(result) {
        return yield db.results.insert(result);
    },
    *markRootAsModified(_id, last_activity) {
        return yield db.results.update({ _id }, { "$set": { last_activity } });
    },
    *markEmbededAsModified(_id, objectId, last_activity) {
        return yield db.results.update({ _id, "embeded.objectId": objectId }, { "$set": { "embeded.$.last_activity": last_activity } });
    },
    *pushToRoot(_id, statement) {
        return yield db.results.update({ _id }, { "$push": { root: statement } });
    },
    *pushToEmbeded(_id, embeded) {
        return yield db.results.update({ _id }, { "$push": { embeded }});
    },
    *pushToEmbededRoot(_id, objectId, statement) {
        return yield db.results.update({ _id, "embeded.objectId": objectId }, { "$push": { "embeded.$.root": statement } });
    },
    *pushToAnswered(_id, objectId, statement) {
        return yield db.results.update({ _id, "embeded.objectId": objectId }, { "$push": { "embeded.$.answered": statement } });
    },
    *pushToExperienced(_id, objectId, statement) {
        return yield db.results.update({ _id, "embeded.objectId": objectId }, { "$push": { "embeded.$.experienced": statement } });
    }
};

function getJsonStreamWrapperParameters(wrapper){
    return ['{"' + wrapper + '":[', ',', ']}'];
};

function getComparator(dateFieldName) {
    return (a, b) => ((new Date(a[dateFieldName])).getTime() < (new Date(b[dateFieldName])).getTime()) ? 1: -1;
};

function transform(result) {
    if(!result) 
        return;
    if(result.root && result.root.length){
        result.root = result.root.sort(getComparator('timestamp'));
    }
    if(result.embeded && result.embeded.length) {
        result.embeded = result.embeded.sort(getComparator('last_activity'));
        result.embeded.forEach(group => {
            if(group.root && group.root.length){
                group.root = group.root.sort(getComparator('timestamp'));
            }
            if(group.answered && group.answered.length) {
                group.answered = group.answered.sort(getComparator('timestamp'));
            }
            if(group.experienced && group.experienced.length) {
                group.experienced = group.experienced.sort(getComparator('timestamp'));
            }
        });
    }
};