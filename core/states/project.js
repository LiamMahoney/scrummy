const { Label } = require('../actions');

/**
 * Creates a `project: <project>` label for the project
 * created.
 * 
 * @param {Object} data webhook payload
 */
async function projectCreated(data) {
    try {
        await Label.createLabel(data.repository.owner.login, data.repository.name, `project: ${data.project.name.toLowerCase()}`);

        return `created label 'project: ${data.project.name.toLowerCase()}'`;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    projectCreated
}