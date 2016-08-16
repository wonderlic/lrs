'use strict';

var monk = require('monk');

var
    url = 'mongodb://' + process.env.IP + '/lrs',
    db = monk(url),
    statements = db.get('statements'),
    results = db.get('results');

module.exports = {
    statements: statements,
    results: results
};