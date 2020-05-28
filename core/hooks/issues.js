const issue = require('../states/issue');
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
        let repo = {
            owner: data.repository.owner.login,
            name: data.repository.name
        }
        
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
        }
    } catch (err) {
        throw err;
    }
}

class IssueHook extends ParentObjectHook {
    
    constructor(data) {
        super(data);
        this.type = 'issue';
    }

    /**
     * Adds the issue to the project of the label that was added to the issue.
     * 
     * @returns {String} message stating what project card was just created
     * @throws {Error} when a project that matches the project label can't be found 
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
                        return await actions.Issue.addIssueToProject(this.hook.issue.number, repoProject.name, columns[0].id, this.hook.issue.id, "Issue");
                    }

                    throw Error(`No columns in the project '${repoProject.name}' were found while trying to add a project card for #${this.hook.issue.number}`);
                }
            }

            throw Error(`Couldn't find a matching project for the label '${this.hook.label.name}' which was just added to #${this.hook.issue.number}.`);
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

            return await Promise.all(proms);
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
            for (let label of this.hook.issue.labels) {
                // checking if the label is a stage label
                if (label.name.substr(0, label.name.indexOf(':')).toLowerCase().trim() === 'stage') {
                    // checking if the stage label is the stage label that was just added
                    if (label.name != this.hook.label.name) {
                        // removing old stage label
                        return await actions.Issue.removeLabel(this.hook.issue.number, label.name, this.repositoryOwner, this.repository);
                    }
                }
            }

            //TODO: this should be a different level of logging
            return `No old stage label found on #${this.hook.issue.number}`;
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
            let projectCards = await actions.Issue.getProjectCards(this.hook.issue.number, this.repositoryOwner, this.repository);
            
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
                        proms.push(`Couldn't find the stage '${stage}' in the project '${projectCard.node.project.name}' while trying to move project card in this project for #${this.hook.issue.number}`);
                    }
                }
            }
            
            //FIXME: this return is logging as [object Object]
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

            let projectCards = await actions.Issue.getProjectCards(this.hook.issue.number, this.repositoryOwner, this.repository);

            for (let projectCard of projectCards.data.repository.parentObject.projectCards.edges) {
                // finding project with same name as label removed
                if (projectCard.node.project.name.toLowerCase().trim() === project) {
                    // deleting issue's project card in that project.
                    return await actions.ProjectCard.deleteProjectCard(projectCard.node.databaseId);
                }
            }

            throw Error(`Couldn't find project card in project '${project}' for #${this.hook.issue.number} after the label '${this.hook.label.name}' was removed`);
        } catch (err) {
            throw err;
        }
    }
}

module.exports = {
    issues
}