const { Project } = require('../actions');
const { OutOfSync } = require('../../utils/errors');


/**
 * Creates a new 'milestone' project by creating a copy of the 'template' 
 * project.
 * 
 * @param {Object} data milestone webhook payload 
 */
async function milestoneCreated(data) {
    try {
        let projects = await Project.getRepoProjects(data.repository.owner.login, data.repository.name);

        // finding the template project
        for(project of projects) {
            if (project.name.toLowerCase().trim() === 'template') {
                let description = `${data.milestone.description}\nDue on: ${new Date(data.milestone.due_on).toDateString()}`;
                
                return await Project.cloneProject(data.repository.node_id, project.node_id, data.milestone.title, description);
            }
        }

        throw OutOfSync(`failed to create project for milestone '${data.milestone.title}'`);
    } catch (err) {
        throw err;
    }
}

module.exports = {
    milestoneCreated
}