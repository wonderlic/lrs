'use strict'

var
    url = 'mongodb://' + process.env.IP + '/lrs',

    monk = require('monk'),
    wrap = require('co-monk'),

    db = monk(url);

module.exports = {
    statements: wrap(db.get('statements'))
};