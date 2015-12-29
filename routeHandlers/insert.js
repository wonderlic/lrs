'use strict';

var 
    parse = require('co-body'),
    db = require("../db");

module.exports = function*(next) {
    yield db.statements.insert(yield parse(this));
    this.status = 200;
}