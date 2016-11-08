'use strict';

var monk = require('monk');
var constants = require('../constants');

var
    url = 'mongodb://' + process.env.IP + '/lrs',
    db = monk(url, { connectTimeoutMS: constants.dbConnectionTimeout, socketTimeoutMS: constants.dbSocketTimeout }),
    statements = db.get('statements'),
    results = db.get('results');

module.exports = {
    statements: statements,
    results: results
};