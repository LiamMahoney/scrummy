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
        let p = undefined;

        switch (data.action) {
            case 'labeled':
                p = new PullRequestHook(data);
                return await p.labeled();
            case 'unlabeled':
                p = new PullRequestHook(data);
                return await p.unlabeled();
            case 'opened':
                p = new PullRequestHook(data);
                return await p.created();
        }
    } catch (err) {
        throw err;
    }
}

class PullRequestHook extends ParentObjectHook {
    constructor(data) {
        super(data);
        this.actionModule = 'PullRequest';
        this.hookKey = 'pull_request';
        this.number = data.pull_request.number;
        this.id = data.pull_request.id;
    }
}

module.exports = {
    pullRequest
}