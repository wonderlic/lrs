var
    MongoClient = require('mongodb').MongoClient,
    Q = require('q'),

    url = 'mongodb://' + process.env.IP + '/lrs';


module.exports = {
    add: add,
    get: get
};


function get(query) {
    var dfd = Q.defer();

    MongoClient.connect(url, function(err, db) {
        var collection = db.collection('statements');

        collection.find({}).toArray(function(err, doc) {
            if (err) {
                deferred.reject(err);
            }
            else {
                dfd.resolve(doc);
            }
            db.close();
        });
    })

    return dfd.promise;
}

function add(statement, callback) {
    var dfd = Q.defer();

    MongoClient.connect(url, function(err, db) {
        var collection = db.collection('statements');

        collection.insert(statement, function(err, doc) {
            if (err) {
                deferred.reject(err);
            }
            else {
                dfd.resolve(doc);
            }
            db.close();
        });

    });

    return dfd.promise;
}