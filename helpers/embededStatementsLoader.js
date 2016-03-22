'use strict';

var 
    constants = require("../constants"),
    getEmbededStatements = require("../commands/getEmbededStatements"),
    statementsMapper = require('./statementsMapper');
    
module.exports = {
    load: function* (results) {
        for (var i = 0; i < results.length; i ++) {
            var rootContext = results[i].root[0].context;
            if(!rootContext || !rootContext.registration) {
                continue;
            }
            
            var embededStatements = yield getEmbededStatements.execute(rootContext.registration);
            if(!embededStatements || !embededStatements.length) {
                continue;
            }
            
            var masteredGroup =  statementsMapper.findStatementGroupById(embededStatements, constants.statementsVerbs.mastered),
                progressedGroup = statementsMapper.findStatementGroupById(embededStatements, constants.statementsVerbs.progressed),
                answeredGroup = statementsMapper.findStatementGroupById(embededStatements, constants.statementsVerbs.answered),
                experiencedGroup = statementsMapper.findStatementGroupById(embededStatements, constants.statementsVerbs.experienced);
            
            var embededResults = statementsMapper.mapEmbededResults(masteredGroup, progressedGroup, answeredGroup, experiencedGroup);
            if(embededResults) {
                results[i].embeded = embededResults;
            }
        }
    }
}