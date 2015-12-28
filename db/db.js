'use strict';

var
    url = 'mongodb://' + process.env.IP + '/nlrs',
	MongoClient = require('mongodb').MongoClient;

module.exports = {
    connect: function() {
        return new Promise(function(resolve, reject) {
            MongoClient.connect(url, function(err, db) {
                if(err !== null)
                    reject(err);
                resolve(db);
            });
        });
	},
	query: function(collection, method, params, convertToArray){
        return new Promise(function(resolve, reject) {
            var dbResponseHandler = function(err, res) {
				if(err !== null)
					reject(err);
                resolve(res);
			},
			args = params instanceof Array ? params: [params];
            
            if(!convertToArray) {
                args.push(dbResponseHandler);
                collection[method].apply(collection, args);
            } else
                collection[method].apply(collection, args).toArray(dbResponseHandler);
        });
	}
};