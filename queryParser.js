'use strict';

var constants = require("./constants");

module.exports = {
    generateOptions: function (query, defaultLimit, defaultSkip) {
        var objectId = {};
        var criteria = {};
        var specifiedLimit;
        var specifiedSkip;
        var activityType;
        
        for (var prop in query) {

            if (prop === 'limit') {
                specifiedLimit = parseInt(query.limit, 10);
                if (isNaN(specifiedLimit) || specifiedLimit < 1) {
                    specifiedLimit = defaultLimit;
                }
            }

            if (prop === 'skip') {
                specifiedSkip = parseInt(query.skip, 10);
                if (isNaN(specifiedSkip) || specifiedLimit < 0) {
                    specifiedSkip = defaultSkip;
                }
            }
            
            if (prop === 'type') {
                activityType = query.type;
            }
            
            if (prop === 'verb') {
                var verbs = query.verb.split(',')
                if (verbs.length === 1) {
                    criteria['verb.id'] = verbs[0];
                } else if (verbs.length > 1) {
                    criteria['verb.id'] = { $in: verbs };
                }
            }

            if (prop === 'activity') {
                criteria['object.id'] = query.activity;
            }

            if (prop === 'registration') {
                var registrations = query.registration.split(',');
                if (registrations.length === 1) {
                    criteria['context.registration'] = registrations[0];
                } else if (registrations.length > 1) {
                    criteria['context.registration'] = { $in: registrations };
                }
            }

            if (prop.indexOf('context.extensions.') === 0) {
                criteria[prop] = query[prop];
                objectId[prop] = query[prop];
            }

            if (prop === 'agent') {
                query.agent = JSON.parse(query.agent);
                if (query.agent.objectType === 'Agent') {
                    var actorMailToIRI = query.agent.mbox;
                    if (actorMailToIRI.indexOf('mailto:') !== 0) {
                    actorMailToIRI = 'mailto:' + actorMailToIRI;
                    }
                    criteria['actor.mbox'] = actorMailToIRI;
                }
            }

            if (prop === 'parent') {
                criteria['context.contextActivities.parent.id'] = query.parent;
            }
        }
        
        if(activityType && criteria && criteria['verb.id'] && criteria['verb.id'].$in && criteria['verb.id'].$in.length) {
            var verbArray = criteria['verb.id'].$in;
            var progressedIndex = verbArray.indexOf(constants.statementsVerbs.progressed);
            if(progressedIndex != -1) {
                verbArray.splice(progressedIndex, 1);
                delete criteria['verb.id'];
                criteria['$or'] = [ 
                    {
                        'verb.id': { $in: verbArray }
                    },
                    {
                        $and: [
                            {
                                'verb.id': constants.statementsVerbs.progressed 
                            },
                            {
                                'object.definition.type': activityType
                            }
                        ]
                    }
                ];
            }
        }
        
        return {
            objectId: objectId,
            criteria: criteria,
            specifiedLimit: specifiedLimit,
            specifiedSkip: specifiedSkip
        }
    }
}