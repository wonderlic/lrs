'use strict';

module.exports = function(dbCollection)
{
    var add = function (statement) {
         dbCollection.insert(statement);
    };
    
    var get = function (callback) {
        dbCollection.findOne({}, callback);
    };
    
    return {
        add: add,
        get: get
    };
}

