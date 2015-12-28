'use strict';

var 
    queryParser = require("../queryParser"),
	db = require("../db/db"),
    constants = require("../constants");

module.exports = function*() {
    var query = this.request.query || {};

    if (query.statementId) {
        if (Object.keys(query).length !== 1) {
            this.body = 'You can not supply other params along with statementId';
            this.status = 400;
        }
        else {
            var statement = yield db.statements.findOne({
                id: query.statementId
            });
            if (statement) {
                this.body = statement;
                this.status = 200;
            }
        }
    }
    else {
        var options = queryParser.generateOptions(query, constants.defaultLimit, constants.defaultSkip);
       
        var statements = yield db.statements.find(options.criteria, { limit: options.specifiedLimit, skip: options.specifiedSkip, sort: { timestamp: -1 }, fields : { _id: 0 } });
        
        if (statements) {
            this.status = 200;
            this.body = { statements: statements };
        }
    }
}