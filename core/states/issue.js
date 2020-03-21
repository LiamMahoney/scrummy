const { Label, Issue, Project, ProjectCard } = require('../actions');

/**
 * Adds the matching `project: <project>` label that the 
 * issue was just added to.
 * 
 * @param {objet} data webhook payload
 */
async function issueAddedToProject(data) {
    try {
        // let labels = await Label.getAllLabels(data.repository.owner.login, data.repository.name);
        let lables = await Label.getAllLabels();
        console.log(labels);
    } catch (err) {
        throw new Error(err.stack);
    }
}

module.exports = {
    issueAddedToProject
}