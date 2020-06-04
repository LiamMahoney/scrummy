const { Issue } = require('../states');
const actions = require('../actions');
const request = require('../../utils/request');

/**
 * 
 * @param {*} data 
 */
async function projectCard(data) {
    try {
        let p = undefined;

        switch (data.action) {
            case 'created':
                // issue added to project or standalone project card created
                p = new ProjectCardHook(data);
                return await p.created();
            case 'deleted':
                // issue removed from a project or standalone project card deleted
                return 'not implemented';
            case 'converted':
                // project card converted into an issue
                return 'not implemented';
            case 'moved':
                // issue is moved in project
                p = new ProjectCardHook(data);
                return await p.moved();
        }   
    } catch (err) {
        throw err;
    }
}

/**
 * 
 */
class ProjectCardHook {
    /**
     * @param {Object} hook github webhook payload
     */
    constructor(data) {
        this.hook = data;
        this.repository = data.repository.name
        this.repositoryOwner = data.repository.owner.login
    }

    /**
     * Moves the project card to the parent's stage label, if the parent has
     * one. If the project is not a milestone project, add the project label to
     * the parent object.
     * 
     * @returns {Array} list of actions taken
     */
    async created() {
        try {
            let proms = [];

            proms.push(request.genericProjectGet(this.hook.project_card.project_url));
            proms.push(request.genericGet(this.hook.project_card.content_url));

            let [project, parent] = await Promise.all(proms);

            proms = [];

            if (!await this.isMilestoneProject(project)) {
                // add project label
                proms.push(this.addProjectLabelToParent(project.name, parent.number));
            }

            proms.push(this.moveToParentStageLabel(parent.labels));

            return await Promise.all(proms);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Deletes the old stage label on the project card's parent and adds the
     * new stage label that matches the column the project card was just moved
     * to. Adding the new stage label will move all of the parent object's
     * other child cards.
     * TODO: left off here
     * @returns {String} actions taken
     */
    async moved() {
        try {
            let proms = [];
            // parent object of the project card
            proms.push(request.genericGet(this.hook.project_card.content_url));
            proms.push(await request.genericProjectGet(this.hook.project_card.column_url));

            let [parent, column] = await Promise.all(proms);

            if (!await this.isParentStageLabelCorrect(parent.labels, column.name)) {
                proms = [];

                proms.push(this.removeOldStageLabel(parent.labels, parent.number));
                proms.push(this.addNewStageLabel(parent.number, column.name));

                return await Promise.all(proms);
            }
            
            return `project card ${this.hook.project_card.id} was already in the right column`;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Determines if the project is assosciated to a milestone.
     *
     * @param {Object} project response from GET project
     * @returns {Boolean} true if the project is associated to a milestone, false if it is not
     */
    async isMilestoneProject(project) {
        try {
            let milestones = await actions.Milestone.getRepoMilestones(this.repositoryOwner, this.repository);

            for (let milestone of milestones) {
                if (milestone.title.trim().toLowerCase() === project.name.toLowerCase().trim()) {
                    // it's a milestone project
                    return true
                }
            }

            return false;

        } catch (err) {
            throw err;
        }
    }

    /**
     * Adds the project label that matches the project name to the project
     * card's parent. 
     * 
     * @param {String} projectName name of the project to add the label of
     * @param {int} parentNumber number of the parent to add the label to
     */
    async addProjectLabelToParent(projectName, parentNumber) {
        try {            
            let labels = await actions.Label.getAllLabels(this.repositoryOwner, this.repository);

            for (let label of labels) {
                if (label.name.substr(label.name.indexOf(':') + 1).toLowerCase().trim() === projectName.toLowerCase().trim()) {
                    // found the label to add to the parent
                    // both PRs and issues use the same API call to add label
                    return await actions.Issue.addLabels(parentNumber, [label.name], this.repositoryOwner, this.repository);
                }
            }

            // TODO: should log a different level than info
            return `couldn't find a project label that matches ${projectName}, failed to add the project label to #${parent.number}`;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Moves the project card to the parent object's stage label, if there is
     * one.
     * 
     * @param {Array} labels list of label objects added to the parent
     */
    async moveToParentStageLabel(labels) {
        try {
            let stageLabel = await this.findLabelOfType(labels, 'stage');
            let stage = stageLabel.name.substr(stageLabel.name.indexOf(':') + 1).trim().toLowerCase();
            
            // finding the proejct column that matches the stage label name
            let project = await request.genericProjectGet(this.hook.project_card.project_url);

            // TODO: there's gotta be a more efficient way
            let columns = await request.genericProjectGet(project.columns_url);
            
            for (let column of columns) {
                if (column.name.toLowerCase().trim() === stage) {
                    return await actions.ProjectCard.moveProjectCard(this.hook.project_card.node_id, column.node_id);
                }
            }

            throw Error(`failed to move the project card ${this.hook.project_card.id} to a column that matches ${stageLabel}`);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Finds the stage label in the list of labels given to the method. Assumes
     * there is only one type of the label we are searching for in the list
     * labels.
     * 
     * @param {Array} labels list of label objects
     * @param {String} type the type of label to find in the list of labels
     * @returns {Object} label object that has stage in it
     * @throws {Error} when multiple stage labels are found
     */
    async findLabelOfType(labels, type) {
        try {
            let stageLabels = [];

            for (let label of labels) {
                if (label.name.substr(0, label.name.indexOf(':')).toLowerCase().trim() === type.toLowerCase().trim()) {
                    stageLabels.push(label);
                }
            }

            if (stageLabels.length === 1) {
                return stageLabels[0];
            }

            throw Error(`couldn't find stage label`)
        } catch (err) {
            throw err;
        }
    }

    /**
     * Finds the label that matches the given type and name. If I am looking
     * for the label 'stage: To Do', the type would be 'stage' and the name
     * would be 'To Do'.
     * 
     * @param {Array} labels list of labels to find a label from 
     * @param {String} type the type of the label being searched for
     * @param {String} name the second part of the label, e.g. if the label is
     * 'project: Testing 1' the name would be 'Testing 1'
     * @returns {Object} describes the matching label, if found
     */
    async findMatchingLabel(labels, type, name) {
        try {
            for (let label of labels) {
                if (label.name.toLowerCase().trim() === `${type}: ${name}`.toLowerCase().trim()) {
                    return label;
                }
            }

            throw Error(`Couldn't find label that matched type: ${type} name: ${name}`);
        } catch (err) {
            throw err;
        }
    }

    /**
     * Compares the stage label on the parent object with the column the 
     * project card was moved to. 
     * 
     * @param {Array} labels list of labels on the parent object
     * @param {String} columnName the name of the column the project card was
     * moved to
     * @returns {Boolean}
     */
    async isParentStageLabelCorrect(labels, columnName) {
        try {
            // the stage label on the parent object
            let currentStageLabel = await this.findLabelOfType(labels, 'stage');

            // the stage from the stage label on the parent
            let stageLabelStage = currentStageLabel.name.substr(currentStageLabel.name.indexOf(':') + 1).toLowerCase().trim();


            if (columnName.toLowerCase().trim() === stageLabelStage) {
                return true;
            }

            return false;
        } catch (err) {
            throw err;
        }
    }

    /**
     * 
     * @param {Array} labels list of labels on the project card's parent 
     * @param {int} parentNumber the issue / PR number of hte project card's
     * parent
     */
    async removeOldStageLabel(labels, parentNumber) {
        try {
            // finding the stage label on the parent object
            let oldStageLabel = await this.findLabelOfType(labels, 'stage');
            
            // removing old stage label
            return await actions.Issue.removeLabel(parentNumber, oldStageLabel.name, this.repositoryOwner, this.repository);
        } catch (err) {
            throw err;
        }
    }

    /**
     * 
     * @param {int} parentNumber the issue / PR number of the project card's 
     * parent
     * @param {String} columnName the name of the column the project card was 
     * moved to
     */
    async addNewStageLabel(parentNumber, columnName) {
        try {
            let labels = await actions.Label.getAllLabels(this.repositoryOwner, this.repository);

            // finding the stage label that matches the column the project card
            // was moved to
            let newStageLabel = await this.findMatchingLabel(labels, 'stage', columnName);

            return await actions.Issue.addLabels(parentNumber, [newStageLabel.name], this.repositoryOwner, this.repository);
        } catch (err) {
            throw err;
        }
    }
}

module.exports = {
    projectCard
}