var constants = require('../constants');

module.exports = {
    isCourseStatement(statement) {
        return statement.context.extensions[constants.courseKey] && statement.context.registration;
    },
    isStarted(statement) {
        return statement.verb.id === constants.statementsVerbs.started;
    },
    isCourseProgressable(statement) {
        return [constants.statementsVerbs.failed, constants.statementsVerbs.passed].indexOf(statement.verb.id) !== -1 ||
            (statement.verb.id === constants.statementsVerbs.progressed && statement.object.definition.type === constants.activityTypes.course);
    },
    isObjectiveProgressable(statement) {
        return statement.verb.id === constants.statementsVerbs.mastered ||
            (statement.verb.id === constants.statementsVerbs.progressed && statement.object.definition.type === constants.activityTypes.objective);
    },
    isAnswered(statement) {
        return statement.verb.id === constants.statementsVerbs.answered;
    },
    isExperienced(statement) {
        return statement.verb.id === constants.statementsVerbs.experienced;
    }
};