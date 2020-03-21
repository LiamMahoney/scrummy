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
            proms = []
            proms.push(Label.getAllLabels(data.repository.owner.login, data.repository.name));
            proms.push(Project.getProject(data.project_card.project_url));
            proms.push(Issue.getIssue(data.project_card.content_url));

            let [labels, project, issue] = await Promise.all(proms);

            let labelToAdd = await matchProjectLabel(project.name, labels);

            return await Issue.addLabels(issue.number, [labelToAdd.name], data.repository.owner.login, data.repository.name);
        }
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
    issueAddedToProject
}