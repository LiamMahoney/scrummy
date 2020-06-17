const { Project } = require('../states');
const actions = require('../actions');

/**
 * Figures out which action is needed based on the github proejct webook
 * recieved. This function only deals with project webhooks. Actions 
 * are decided based on the data.action (what happened in github).
 * 
 * @param {Object} data: github webhook json data
 */
async function project(data) {
    try {
        switch (data.action) {
            case 'created':
                p = new ProjectHook(data);
                return await p.created();
            case 'deleted':
                return 'not implemented';
            case 'closed':
                return 'not implemented';
            case 'reopened':
                return 'not implemented';
        }
    } catch (err) {
        throw err;
    }
}

class ProjectHook {
    /**
     * @param {Object} hook github webhook payload 
     */
    constructor(hook) {
        this.hook = hook;
        this.repository = hook.repository.name;
        this.repositoryOwner = hook.repository.owner.login;
    }

    /**
     * Creates a project label for the project that was just created.
     * 
     * @returns {String} description of actions taken
     */
    async created() {
        try {

            return await actions.Label.createLabel(this.repositoryOwner, this.repository, `Project: ${this.hook.project.name}`);
        
        } catch (err) {
            throw err;
        }
    }
}

module.exports = {
    project
}