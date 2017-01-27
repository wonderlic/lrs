'use strict';

var monk = require('monk');
var constants = require('../constants');

var
    dbhost = (process.env.DBHOST || process.env.IP || '127.0.0.1'),
    dbname = (process.env.DBNAME || 'lrs'),
    url = 'mongodb://' + dbhost + '/' + dbname,
    db = monk(url, { connectTimeoutMS: constants.dbConnectionTimeout, socketTimeoutMS: constants.dbSocketTimeout }),
    statements = db.get('statements'),
    results = db.get('results');

module.exports = {
    statements: statements,
    results: results
};
