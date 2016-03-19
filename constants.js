'use strict';

module.exports = {
    defaultLimit: 2000,
    defaultSkip: 0,
    statementsVerbs: {
        started: "http://adlnet.gov/expapi/verbs/launched",
        passed: "http://adlnet.gov/expapi/verbs/passed",
        failed: "http://adlnet.gov/expapi/verbs/failed",
        mastered: "http://adlnet.gov/expapi/verbs/mastered",
        answered: "http://adlnet.gov/expapi/verbs/answered",
        experienced: "http://adlnet.gov/expapi/verbs/experienced",
        progressed: "http://adlnet.gov/expapi/verbs/progressed"
    },
    activityTypes: {
        course: "http://adlnet.gov/expapi/activities/course",
        objective: "http://adlnet.gov/expapi/activities/objective"
    }
};