const {ParentObjectHook} = require('./parent_object');
const actions = require('../actions');

/**
 * Figures out which action is needed based on the github issue webook
 * recieved. This function only deals with issue webhooks. Actions 
 * are decided based on the data.action (what happened in github).
 * 
 * @param {Object} data: github webhook json data
 */
async function issues(data) {
    try {        
        let i = undefined;

        switch (data.action) {
            case 'labeled':
                i = new IssueHook(data);
                return await i.labeled();
            case 'unlabeled':
                i = new IssueHook(data);
                return await i.unlabeled();
            case 'milestoned':
                i = new IssueHook(data);
                return await i.milestoned();
            case 'demilestoned':
                i = new IssueHook(data);
                return await i.demilestoned();
            case 'opened':
                i = new IssueHook(data);
                return await i.created();
        }
    } catch (err) {
        throw err;
    }
}

class IssueHook extends ParentObjectHook {
    
    constructor(data) {
        super(data);
        this.actionModule = 'Issue';
        this.hookKey = 'issue';
        this.number = data.issue.number;
        this.id = data.issue.id;
    }
}

module.exports = {
    issues
}