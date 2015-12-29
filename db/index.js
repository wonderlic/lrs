'use strict';

var
    monk = require('monk'),
    wrap = require('co-monk'),
    url = 'mongodb://' + process.env.IP + '/lrs',
    db = monk(url),
    statements = wrap(db.get('statements'));
    
statements.aggregate = function(pipeline) {
    return new Promise(function(resolve, reject) {
        statements.col.aggregate(pipeline, function(err, res) {
            if(err !== null)
                reject(err);
            resolve(res);
        });
    });
}

module.exports = {
    statements: statements
};