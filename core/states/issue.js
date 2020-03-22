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
            let [issue, labelToAdd] = await findProjectLabel(data);

            return await Issue.addLabels(issue.number, [labelToAdd.name], data.repository.owner.login, data.repository.name);
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
            let [issue, labelToRemove] = await findProjectLabel(data);

            return await Issue.removeLabel(issue.number, [labelToRemove.name], data.repository.owner.login, data.repository.name);
        }
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
 * @returns {Array} index 0 contains information about the issue,
 * index 1 contains an object describing the matching project label
 * to add or remove
 */
async function findProjectLabel(data) {
    try {
        proms = []
        proms.push(Label.getAllLabels(data.repository.owner.login, data.repository.name));
        proms.push(Project.getProject(data.project_card.project_url));
        proms.push(Issue.getIssue(data.project_card.content_url));

        let [labels, project, issue] = await Promise.all(proms);

        return [issue, await matchProjectLabel(project.name, labels)];

    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Finds a matching `project: <project>` label for the 
 * project name passed in.
 * 
 * @param {string} projectName name of a github project
 * @param {Object} labels actions.Label.getAllLabels() response
 * @returns {Object} matching `project: <project>` label name/id
 */
async function matchProjectLabel(projectName, labels) {
    try {
        for (label of labels) {
            if (label.name.replace('project:', '').trim().toLowerCase() === projectName.toLowerCase()) {
                return {
                    name: label.name,
                    id: label.id
                }
            }
        }

        throw new Error(`'project: <project>' label not found for project '${projectName}'`);

    } catch (err) {
        throw new Error(err.stack);
    }
}

module.exports = {
    issueAddedToProject,
    issueRemovedFromProject
}