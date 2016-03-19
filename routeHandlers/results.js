'use strict';

var 
    queryParser = require("../queryParser"),
    getRootStatements = require("../commands/getRootStatements"),
    embededStatementsLoader = require("../helpers/embededStatementsLoader"),
    constants = require("../constants");

module.exports = function*() {
    var query = this.request.query || {};
    var loadEmbededStatements = query.embeded;
    var options = queryParser.generateOptions(query, constants.defaultLimit, constants.defaultSkip);
    
    var statements = yield getRootStatements.execute(options.objectId, options.specifiedSkip, options.specifiedLimit);
    
    if(loadEmbededStatements) {
        yield* embededStatementsLoader.load(statements);
    }
    
    if (statements) {
        this.status = 200;
        this.body = { statements: statements };
    }
}