const issue = require('../states/issue');

/**
 * Figures out which action is needed based on the github issue webook
 * recieved. This function only deals with issue webhooks. Actions 
 * are decided based on the data.action (what happened in github).
 * 
 * @param {Object} data: github webhook json data
 */
async function issues(data) {
    try {        
        let repo = {
            owner: data.repository.owner.login,
            name: data.repository.name
        }

        switch (data.action) {
            case 'labeled':
                return await issue.issueLabeled(data);
            case 'unlabeled':
                return await issue.issueUnlabeled(data);
            case 'milestoned':
                return await issue.issueMilestoned(data);
            case 'demilestoned':
                return await issue.issueDemilestoned(data);
        }
    } catch (err) {
        throw err;
    }
}

module.exports = {
    issues
}