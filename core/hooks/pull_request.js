const { PullRequest } = require('../states');

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

module.exports = {
    pullRequest
}