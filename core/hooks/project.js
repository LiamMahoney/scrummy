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
                p = new ProjectHook(data);
                return await p.closed();
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

    /**
     * If the project that was closed is a milestone project:
     *  * close the matching milestone
     * If the project is not a mielstone project:
     *  * delete the matching project label
     * 
     * @returns {String} actions taken
     */
    async closed() {
        try {
            if (await this.isMilestoneProject()) {
                // TODO: good candidate to get moved to it's own method
                let milestones = await actions.Milestone.getRepoMilestones(this.repositoryOwner, this.repository);

                for (let milestone of milestones) {
                    if (milestone.title.toLowerCase().trim() === this.hook.project.name.toLowerCase().trim()) {
                        return await actions.Milestone.close(milestone.number, this.repositoryOwner, this.repository);
                    }
                }

                return `could not find a matching milestone for project '${this.hook.project.name}'`;
            } else {
                // delete project label
                return await actions.Label.deleteLabel(`Project: ${this.hook.project.name}`, this.repositoryOwner, this.repository);
            }
        } catch (err) {
            throw err;
        }
    }

    /**
     * Determines if the project is a associated to a milestone or not.
     * 
     * @returns {Boolean} whether or not the project is a milestone project
     */
    async isMilestoneProject() {
        try {
            let milestones = await actions.Milestone.getRepoMilestones(this.repositoryOwner, this.repository);
            for (let milestone of milestones ) {
                if (milestone.title.toLowerCase().trim() === this.hook.project.name.toLowerCase().trim()) {
                    return true;
                }
            }

            return false;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = {
    project
}