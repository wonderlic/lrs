'use strict';

var 
    queryParser = require("../queryParser"),
    constants = require("../constants"),
    command = require('../commands/results');

var courseKey = 'context.extensions.' + constants.courseKey;

module.exports = function*() {
    var query = this.request.query || {};
    var loadEmbededStatements = query.embeded;
    var options = queryParser.generateOptions(query, constants.defaultLimit, constants.defaultSkip);
    
    var stream;
    if(loadEmbededStatements) { 
        stream = yield* command.getFull(options.objectId[courseKey], options.specifiedSkip, options.specifiedLimit);
    } else {
        stream = yield* command.getRoot(options.objectId[courseKey], options.specifiedSkip, options.specifiedLimit);
    }

    if (stream) {
        this.status = 200;
        this.set({ "Content-Type": "application/json" });
        this.body = stream;
    }
}