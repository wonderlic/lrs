var monk = require('monk');
var wrap = require('co-monk');

var url = 'mongodb://' + process.env.IP + '/lrs'

var db = monk(url);

db.statements = wrap(db.get('statements'));
module.exports = db;