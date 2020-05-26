const actions = require('../actions');

/**
 * Objects within GitHub that can have associated project cards created from
 * them (Issues or Pull Requests).
 */
class ParentObjectHook {

    constructor(data) {
        this.hook = data;
        this.repository = data.repository.name
        this.repositoryOwner = data.repository.owner.login
    }


    /**
     * Gets the first column of the 'template' project and adds the matching 
     * stage label to the Parent Object.
     */
    async created() {
        try {
            throw error("NOT IMPLEMENTED");
        } catch (err) {
            throw err;
        }
    }

    /**
     * 1. Determine type of label added
     * 2a. If stage label: move all child project cards to the stage in the
     * label
     * 2b. if project label: create project card in that project
     */
    async labeled() {
        try {
            let type = await this.determineLabelType(this.hook.label);

            switch(type) {
                case 'project':
                    return await this.projectLabelAdded();
                case 'stage':
                    return await this.stageLabelAdded();
            }
        } catch (err) {
            throw err;
        }
    }

    /**
     * 1. Determine the type of label removed
     * 2a. If project label: delete the associated project card in the project
     * that matches the project label
     */
    async unlabeled() {
        try {
            let type = await this.determineLabelType(this.hook.label);

            switch(type) {
                case 'project':
                    return await this.projectLabelRemoved();
            }
        } catch (err) {
            throw err;
        }
    }

    /**
     * Creates a project card in the associated milestone project and places
     * it in the first column in the project. If the project card needs to be 
     * moved (parent has a stage label other than first column), this is 
     * handled by hook: project_card action: created.
     * NOTE: pull request milestone actions come through the issue webhook. The
     * same actions work for both Issues and PRs.
     * 
     * @returns {String} statement of the actions that were done
     */
    async milestoned() {
        try {
            let milestoneProject = await this.getMilestoneProject();

            let columns = await actions.Project.getProjectColumns(milestoneProject.columns_url);

            // adding project card to first column in project - if there's a stage label on the 
            // issue this will be handled by hook: project_card action: created
            return await actions.Issue.addIssueToProject(this.hook.issue.number, milestoneProject.name, columns[0].id, this.hook.issue.id, 'Issue');
        } catch (err) {
            throw err;
        }
    }

    /**
     * Determines if an Issue or a Pull Request was just demilestoned in order
     * to supply the demilestonedHelper with the proper parameters.
     * NOTE: thought this was the best way to handle both PRs and Issues coming
     * through the same hook for demilestone actions.
     * 
     * @returns {String} statement of the actions that were done
     */
    async demilestoned() {
        try {
            // this blows
            if (this.hook.issue.html_url.indexOf('issues') > -1) {
                // Issues have 'issues' in the html_url value
                return await this.demilestonedHelper('Issue', 'issue');
            } else if (Object.keys(this.hook.issue).indexOf('pull_request') > -1) {
                // PRs have a 'pull_request' key in this.hook.issue - this 
                // could be changed to check for 
                // this.hook.issue.html_url.indexOf('pull')
                return await this.demilestonedHelper('PullRequest', 'pullRequest');
            } else {
                return `while determining the type of parent object that was dmeilestoned, encountered unexpcted type. Hook: ${this.hook}`;
            }
        } catch (err) {
            throw err;
        }
    }

    /**
     * Searches all of the labels in the repository for labels that start with
     * the type passed in.
     * 
     * @param {String} type the type of label to find
     * @returns {Array} list of all of the labels of the type
     */
    async getRepoLabelsOfType(type) {
        try {
            let labels = await actions.Label.getAllLabels(this.repository, this.repositoryOwner);

            let matched = [];

            for (label of labels) {
                if (label.name.indexOf(type) === 0) {
                    matched.append(label);
                }
            }

            return matched;

        } catch (err) {
            throw err;
        }
    }

    /**
     * Determines the type of the label.
     * 
     * @param {Object} label the label just interacted with the parent object
     * @returns {String} the label 'type'
     */
    async determineLabelType(label) {
        try {
            if (label.name.indexOf(':') > -1) {
                // returning everything before the first ':', which should be
                // the type of the label
                return label.name.substr(0, label.name.indexOf(':')).trim().toLowerCase();
            }

            throw Error(`Couldn't find a type on the label '${label.name}'`);
        } catch (err) {
            throw err;
        }
    }

    /**
     * ABSTRACT METHOD
     * Needs to be implemented in a class that extends this one.
     */
    async projectLabelAdded() {
        throw Error('this is an abstract method that needs to be implemented in a child class');
    }

    /**
     * ABSTRACT METHOD
     * Needs to be implemented in a class that extends this one.
     */
    async stageLabelAdded() {
        throw Error('this is an abstract method that needs to be implemented in a child class');
    }

    /**
     * ABSTRACT METHOD
     * Needs to be implemented in a class that extends this one.
     */
    async projectLabelRemoved() {
        throw Error('this is an abstract method that needs to be implemented in a child class');
    }

    /**
     * Gets the project associated to the milestone in the webhook.
     * 
     * @returns {Object} representation of the milestone project
     * @throws {Error} if no project is found with a matching name as the milestone
     */
    async getMilestoneProject() {
        try {
            let projects = await actions.Project.getRepoProjects(this.repositoryOwner, this.repository);

            for (let project of projects) {
                if (project.name.toLowerCase().trim() === this.hook.milestone.title.toLowerCase().trim()) {
                    return project;
                }
            }

            throw Error(`couldn't find project for milestone '${this.hook.milestone.name}'`);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Removes the project card in the milestone project the parent object was
     * just demilestoned from.
     * NOTE: pull request milestone actions come through the issue webhook,
     * which made me make this method this twisted way. The only change between
     * Issues and PRs is the method to call to get their associated project
     * cards and the name of one of the keys returned by that method. Keeping
     * actionModule and pcKey as separate parameters for clarity.
     * 
     * @param {String} actionModule the name of the action module to use, one of:
     * ['PullRequest', 'Issue']
     * @param {String} pcKey the key to use for the return data from the get
     * project cards function, one of: ['pullRequest', 'issue']
     * @returns {String} statement of the actions that were done
     * @throws {Error} if the issue doesn't have a project card in the project
     * with the same name as the milestone the issue was just demilestoned
     * from
     */
    async demilestonedHelper(actionModule, pcKey) {
        try {
            let projectCards = await actions[actionModule].getProjectCards(this.hook.issue.number, this.repositoryOwner, this.repository);

            // iterating through Issue's project cards trying to find the one 
            // in the milestone project it was just demilestoned from
            for (let projectCard of projectCards.data.repository[pcKey].projectCards.edges) {
                // if the project is closed (meaning the milestone is closed)
                // we want to preseve the state of the milestone when it was
                // closed
                if (projectCard.node.project.state === 'OPEN') {
                    if (projectCard.node.project.name.toLowerCase().trim() === this.hook.milestone.title.toLowerCase().trim()) {
                        return await actions.ProjectCard.deleteProjectCard(projectCard.node.databaseId);
                    }
                }
            }

            throw Error(`couldn't find a project card in the milestone project '${this.hook.milestone.title}' for #${this.hook.issue.number}`);
        } catch (err) {
            throw err;
        }
    }
}

module.exports = {
    ParentObjectHook
}