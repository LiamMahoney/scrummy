const { PullRequest } = require('../states');
const { ParentObjectHook } = require('./parent_object');

/**
 * Figures out which action is needed based on the github proejct webook
 * recieved. This function only deals with project webhooks. Actions 
 * are decided based on the data.action (what happened in github).
 * 
 * @param {Object} data: github webhook json data
 */
async function pullRequest(data) {
    try {
        switch (data.action) {
            case 'labeled':
                return await PullRequest.pullRequestLabeled(data);
            case 'unlabeled':
                return await PullRequest.PullRequestUnlabeled(data);
        }
    } catch (err) {
        throw err;
    }
}

class PullRequestHook extends ParentObjectHook {
    constructor(data) {
        super(data);
        this.type = 'pull_request';
    }
}

module.exports = {
    pullRequest
}