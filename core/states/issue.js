const { Label, Issue, Project, ProjectCard } = require('../actions');

/**
 * Adds the matching `project: <project>` label that the 
 * issue was just added to.
 * 
 * @param {Object} data webhook payload
 */
async function issueAddedToProject(data) {
    try {
        // checking that the project card is an instance of an issue
        // only project cards that are instances of issues have the content_url field
        if (data.project_card.content_url) {
            let proms = [];
            proms.push(Issue.getIssue(data.project_card.content_url));
            proms.push(findProjectLabel(data));

            let [issue, labelToAdd] = await Promise.all(proms);

            let resp = await Issue.addLabels(issue.number, [labelToAdd.name], data.repository.owner.login, data.repository.name);

            // getting the labels that were added from the response to form the return statement (what is logged)
            labelsAdded = [];
            for (label of resp) {
                labelsAdded.push(label.name);
            }

            return `added label(s) [${labelsAdded.join(', ')}] to issue #${issue.number}`;
        }
    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Removes the matching `project: <project>` label that the 
 * issue was just removed from.
 * 
 * @param {Object} data webhook payload
 */
async function issueRemovedFromProject(data) {
    try {
        // checking that the project card is an instance of an issue
        // only project cards that are instances of issues have the content_url field
        if (data.project_card.content_url) {
            let proms = [];
            proms.push(Issue.getIssue(data.project_card.content_url));
            proms.push(findProjectLabel(data));

            let [issue, labelToRemove] = await Promise.all(proms);

            let resp = await Issue.removeLabel(issue.number, [labelToRemove.name], data.repository.owner.login, data.repository.name);

            return `removed label '${labelToRemove.name}' from issue #${issue.number}`;
        }
    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Adds the matching `<project>: project` and `<stage>`: stage
 * labels to the issue. Adds the project and the stage where
 * the project card was converted.
 * 
 * @param {Object} data webhook payload
 */
async function projectCardConverted(data) {
    try {
        let proms = [];
        proms.push(Issue.getIssue(data.project_card.content_url));
        proms.push(findProjectLabel(data));
        proms.push(findStageLabel(data));

        let [issue, projectLabel, stageLabel] = await Promise.all(proms);

        let resp = await Issue.addLabels(issue.number, [projectLabel.name, stageLabel.name], data.repository.owner.login, data.repository.name);
        
        // getting the labels that were added from the response to form the return statement (what is logged)
        labelsAdded = [];
        for (label of resp) {
            labelsAdded.push(label.name);
        }

        return `added label(s) [${labelsAdded.join(', ')}] to issue #${issue.number}`;

    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Finds the matching `project: <project>` for the project
 * the project card (instance of issue) was just added to
 * or removed from.
 * 
 * @param {Object} data webhook payload
 * @returns {Object} describes the matching project label
 * to add or remove with name and id keys
 */
async function findProjectLabel(data) {
    try {
        proms = [];
        proms.push(Label.getAllLabels(data.repository.owner.login, data.repository.name));
        proms.push(Project.getProject(data.project_card.project_url));

        let [labels, project] = await Promise.all(proms);

        return await matchLabel(project.name, labels, 'project:');

    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Finds the matching `project: <project>` for the project
 * the project card (instance of issue) was just added to
 * or removed from.
 * 
 * FIXME: if I create a general 'get url' request (rather than having 2 identical methods in Project.getProject and Project.getColumn) then I can combine this method and the findProjectLabel method.
 * 
 * @param {Object} data webhook payload
 * @returns {Object} describes the matching project label
 * to add or remove with name and id keys
 */
async function findStageLabel(data) {
    try {
        proms = [];
        proms.push(Label.getAllLabels(data.repository.owner.login, data.repository.name));
        proms.push(Project.getColumn(data.project_card.column_url));

        let [labels, column] = await Promise.all(proms);

        return await matchLabel(column.name, labels, 'stage:');

    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Finds a matching `project: <project>` label for the 
 * project name passed in.
 * 
 * @param {string} labelName 2nd part of the github label to match to
 * @param {Object} labels actions.Label.getAllLabels() response
 * @param {string} type the type of label to match, could be 'project' or 'stage'
 * @returns {Object} matching `project: <project>` label name/id
 */
async function matchLabel(labelName, labels, type) {
    try {
        for (label of labels) {
            if (label.name.replace(type, '').trim().toLowerCase() === labelName.toLowerCase()) {
                return {
                    name: label.name,
                    id: label.id
                }
            }
        }

        throw new Error(`'${type} <${type}>' label not found for ${type} '${labelName}'`);

    } catch (err) {
        throw new Error(err.stack);
    }
}

module.exports = {
    issueAddedToProject,
    issueRemovedFromProject,
    projectCardConverted
}