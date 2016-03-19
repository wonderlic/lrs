'use strict';

var _ = require('underscore');

module.exports = {
    findStatementGroupById: function(embededStatements, id) {
        return _.find(embededStatements, function(statement) {
            return statement._id === id;
        });
    },
    
    mapEmbededResults: function(masteredGroup, progressedGroup, answeredGroup, experiencedGroup) {
        var embededStatements = groupEmbededStatements(masteredGroup, progressedGroup);
        return embededStatements ? _.map(embededStatements, function(statementGroup) {
            return {
                root: statementGroup,
                answered: mapChildStatements(answeredGroup, statementGroup[0]),
                experienced: mapChildStatements(experiencedGroup, statementGroup[0])
            };
        }): embededStatements;
    }
}

function mapChildStatements(statementGroup, parentStatement) {          
    return statementGroup && statementGroup.statements ? _.sortBy(_.filter(statementGroup.statements, function(element) {
        try {
            return _.some(element.context.contextActivities.parent, function(item){ return item.id === parentStatement.object.id; });
        } catch(e) {
            return false;
        }
    }), function(statement){ return -(new Date(statement.timestamp)).getTime(); }) : null;
}
    
function groupEmbededStatements(masteredGroup, progressedGroup) {
    var allStatements = null;
    if(masteredGroup && masteredGroup.statements) {
        allStatements = masteredGroup.statements;
    }
    if(progressedGroup && progressedGroup.statements) {
        allStatements = allStatements ? allStatements.concat(progressedGroup.statements): progressedGroup.statements;
    }
    if(!allStatements){
        return null;
    }
    var groupedStatements = [];
    var statements = allStatements.sort(function(statement1, statement2) {
        var statement1Object = statement1.object || {};
        var statement2Object = statement2.object || {};
        if(statement1Object.id && statement1Object.id === statement2Object.id) {
            return (new Date(statement1.timestamp)).getTime() < (new Date(statement2.timestamp)).getTime();
        }
        return statement1Object.id ? statement1Object.id > statement2Object.id: false;
    });
    
    groupedStatements.push([statements[0]]);
    for(var i = 1; i < statements.length; i++) {
        var groupStatement = groupedStatements[groupedStatements.length -1][0];
        var id = statements[i].object && statements[i].object.id;
        var groupId = groupStatement.object && groupStatement.object.id;
        
        if(id && groupId === id) {
            groupedStatements[groupedStatements.length -1].push(statements[i]);
        } else {
            groupedStatements.push([statements[i]]);
        }
    }
    
    return _.sortBy(groupedStatements, function(item){
        return -(new Date(item[0].timestamp)).getTime();
    });
}