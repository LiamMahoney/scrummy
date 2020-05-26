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
     * ABSTRACT METHOD
     * Needs to be implemented in a class that extends this one.
     */
    async demilestoned() {
        throw Error('this is an abstract method that needs to be implemented in a child class');
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
}

module.exports = {
    ParentObjectHook
}