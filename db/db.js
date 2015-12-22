'use strict';

var
	Q = require('q'),
    url = 'mongodb://' + process.env.IP + '/nlrs',
	MongoClient = require('mongodb').MongoClient;

module.exports = {
    connect: function(){
		return Q.nfcall(MongoClient.connect, url, {});
	},
	query: function(collection, method, params, convertToArray){
		var dfd = Q.defer(),
			dbResponseHandler = function(err, res){
				if(err){
					dfd.reject(err);
				}
				dfd.resolve(res);
			},
			args = params instanceof Array ? params: [params]
		
		if(!convertToArray) {
			args.push(dbResponseHandler);
			collection[method].apply(collection, args);
		} else {
			collection[method].apply(collection, args).toArray(dbResponseHandler);
		}
		
		return dfd.promise;
	}
};