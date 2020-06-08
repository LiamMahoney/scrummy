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
     * 
     * @returns {String} statement of the actions that were done
     */
    async created() {
        try {
            let proms = [];
            proms.push(actions.Project.getRepoProjects(this.repositoryOwner, this.repository));
            proms.push(actions.Label.getAllLabels(this.repositoryOwner, this.repository));

            let [projects, labels] = await Promise.all(proms);

            for (let project of projects) {
                if (project.name.toLowerCase() === 'template') {
                    let columns = await actions.Project.getProjectColumns(project.columns_url);

                    for (let label of labels) {
                        if (label.name.toLowerCase().trim() === `stage: ${columns[0].name.toLowerCase().trim()}`) {
                            return await actions.Issue.addLabels(this.number, [label.name], this.repositoryOwner, this.repository);
                        }
                    }
                }
            }

            throw Error(`failed to add the first stage label in the template project for #${this.number}`);
        } catch (err) {
            throw err;
        }
    }

    /**
     * 1. Determine type of label added
     * 2a. If stage label: move all child project cards to the stage in the
     * label
     * 2b. if project label: create project card in that project
     * 
     * @returns {String} statement of the actions that were done
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
     * 
     * @returns {String} statement of the actions that were done
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
     * Creates   project card in the associated milestone project and places
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
            return await actions.Issue.addToProject(this.hook.issue.number, milestoneProject.name, columns[0].id, this.hook.issue.id, 'Issue');
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
     * Adds the parent obeject to the project of the label that was added to 
     * the parent object.
     * 
     * @returns {String} message stating what project card was just created
     * @throws {Error} when a project that matches the project label can't be 
     * found 
     */
    async projectLabelAdded() {
        try {
            let repoProjects = await actions.Project.getRepoProjects(this.repositoryOwner, this.repository);
            
            // project from the project label
            let project = this.hook.label.name.substr(this.hook.label.name.indexOf(':') + 1).trim().toLowerCase();

            for (let repoProject of repoProjects) {
                // finding project with same name as project label just added
                if (repoProject.name.trim().toLowerCase() === project) {
                    // getting project columns
                    let columns = await actions.Project.getProjectColumns(repoProject.columns_url);
                    
                    if (columns.length > 0) {
                        // adding issue to project
                        return await actions.Issue.addToProject(this.number, repoProject.name, columns[0].id, this.id, this.actionModule);
                    }

                    throw Error(`No columns in the project '${repoProject.name}' were found while trying to add a project card for #${this.number}`);
                }
            }

            throw Error(`Couldn't find a matching project for the label '${this.hook.label.name}' which was just added to #${this.number}.`);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Removes the old stage label from the issue and moves all of the issue's
     * child project cards to the correct column.
     * 
     * @returns {Array} return messages from actions taken
     */
    async stageLabelAdded() {
        try {
            let proms = [];

            proms.push(this.removeOldStageLabel());
            proms.push(this.moveChildProjectCards());

            let [label, move] = await Promise.all(proms);
            
            // destructuring return so it's logged properly
            return [label, ...move];
        } catch (err) {
            throw err;
        }
    }

    /**
     * Removes the old stage label from the issue.
     * 
     * @returns {String} return message from removing the stage label
     */
    async removeOldStageLabel() {
        try {
            for (let label of this.hook[this.hookKey].labels) {
                // checking if the label is a stage label
                if (label.name.substr(0, label.name.indexOf(':')).toLowerCase().trim() === 'stage') {
                    // checking if the stage label is the stage label that was just added
                    if (label.name != this.hook.label.name) {
                        // removing old stage label - same call for both
                        return await actions.Issue.removeLabel(this.number, label.name, this.repositoryOwner, this.repository);
                    }
                }
            }

            //TODO: this should be a different level of logging
            return `No old stage label found on #${this.number}`;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Moves all of the Issue's child project cards to the column that matches
     * the stage label added to the Issue.
     * 
     * @returns {Array} return messages from moving child project cards
     */
    async moveChildProjectCards() {
        try {
            let projectCards = await actions[this.actionModule].getProjectCards(this.number, this.repositoryOwner, this.repository);
            
            // stage from the stage label
            let stage = this.hook.label.name.substr(this.hook.label.name.indexOf(':') + 1).trim().toLowerCase();

            let proms = [];

            for (let projectCard of projectCards.data.repository.parentObject.projectCards.edges) {

                // checking if the project card is in the right column and the project is open
                if (projectCard.node.column.name.toLowerCase().trim() !== stage && projectCard.node.project.state !== 'CLOSED') {
                    // number of promises created so far, number of columns properly found
                    let initLen = proms.length;

                    // project card isn't in the right column, need to find the right column in that project
                    for (let projectColumn of projectCard.node.project.columns.edges) {
                        if (projectColumn.node.name.toLowerCase().trim() === stage) {
                            // found the column with the same name in the project card's project
                            // move the project card to this column
                            proms.push(actions.ProjectCard.moveProjectCard(projectCard.node.id, projectColumn.node.id));
                            break;
                        }
                    }
                    // checking if a new promise was added to the array, meaning the column
                    // was found in this project
                    if (initLen === proms.length) {
                        // TODO: needs to be logged at different level than info - should I be logging here?
                        proms.push(`Couldn't find the stage '${stage}' in the project '${projectCard.node.project.name}' while trying to move project card in this project for #${this.number}`);
                    }
                }
            }
            
            return await Promise.all(proms);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Deletes the project card associated to the issue in the project that
     * matches the label that was just removed.
     *
     * @returns {String} message stating what actions were taken
     */
    async projectLabelRemoved() {
        try {
            // getting project name from the label that was just removed
            let project = this.hook.label.name.substr(this.hook.label.name.indexOf(':') + 1).toLowerCase().trim();

            let projectCards = await actions[this.actionModule].getProjectCards(this.number, this.repositoryOwner, this.repository);

            for (let projectCard of projectCards.data.repository.parentObject.projectCards.edges) {
                // finding project with same name as label removed
                if (projectCard.node.project.name.toLowerCase().trim() === project) {
                    // deleting issue's project card in that project.
                    await actions.ProjectCard.deleteProjectCard(projectCard.node.databaseId);

                    return `removed label '${this.hook.label.name}' from #${this.number}`;
                }
            }

            throw Error(`Couldn't find project card in project '${project}' for #${this.number} after the label '${this.hook.label.name}' was removed`);
        } catch (err) {
            throw err;
        }
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
            for (let projectCard of projectCards.data.repository.parentObject.projectCards.edges) {
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