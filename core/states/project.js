const { Label } = require('../actions');
const { isProjectMilestone } = require('./issue');

/**
 * Creates a `project: <project>` label for the project
 * created.
 * 
 * @param {Object} data webhook payload
 */
async function projectCreated(data) {
    try {
        if (! await isProjectMilestone(data.repository.milestones_url.substr(0, data.repository.milestones_url.indexOf("{/number}")), data.project.url)) {
            await Label.createLabel(data.repository.owner.login, data.repository.name, `project: ${data.project.name.toLowerCase()}`);

            return `created label 'project: ${data.project.name.toLowerCase()}'`;
        } 
    } catch (err) {
        throw err;
    }
}

module.exports = {
    projectCreated
}