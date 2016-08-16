// install co before executing results build

var co = require('co');
var migrationManager = require('../migration');

co(migrationManager.build()).then(() => {
    console.log('finished');
}).catch(err => { throw err; });