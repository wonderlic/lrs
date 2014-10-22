'use strict';

var statements = [];

function add(statement) {
    statements.push(statement);
}

function get() {
    return statements;
}

module.exports.add = add;
module.exports.get = get;