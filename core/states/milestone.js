const { Project, Milestone, Issue } = require('../actions');
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

/**
 * Closes the associated milestone project and then removes every issue and PR
 * that was associated to it.
 * 
 * TODO: this functionality makes me think logging in the action would work best
 * 
 * @param {Object} data milestone webhook payload
 * @returns {Array} full of strings that are all responses of actions that have happened
 */
async function milestoneClosed(data) {
    try {
        let responses = [];
        responses.push(await Project.closeProjectName(data.milestone.title, data.repository.name, data.repository.owner.login));
        
        let milestoneItems = await Milestone.getMilestoneItems(data.milestone.number, data.milestone.open_issues, data.repository.owner.login, data.repository.name);

        let proms = [];

        // clearing all issues
        for (issue of milestoneItems.data.repository.milestone.issues.nodes) {
            proms.push(Issue.removeMilestoneFromIssue(issue.number, data.repository.owner.login, data.repository.name));
        }

        // clearing all pull requests
        for (pr of milestoneItems.data.repository.milestone.pullRequests.nodes) {
            proms.push(Issue.removeMilestoneFromIssue(pr.number, data.repository.owner.login, data.repository.name));
        }

        responses.concat(await Promise.all(proms));

        return responses;

    } catch (err) {
        throw err;
    }
}

module.exports = {
    milestoneCreated,
    milestoneClosed
}