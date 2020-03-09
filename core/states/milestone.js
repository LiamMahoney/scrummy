const { Project } = require('../actions');

/**
 * Creates a new milestone board with the same name
 * as the milestone created.
 * 
 * TODO: need to see if there's a way to create this board with the correct columns / automation setup.
 * If there isn't, may want to consider creating a 'sprint' board that is always the same (milestones dont create new boards)
 * 
 * @param {JSON} data: Github webhook data 
 */
function milestoneCreated(data) {
    return new Promise((resolve, reject) => {
        let repo = {
            owner: data.repository.owner.login,
            name: data.repository.name
        }

        resolve(Project.createProject(data.milestone.title, `${data.milestone.description}\nDue on: ${data.milestone.due_on}`, repo));
    });
}

module.exports = {
    milestoneCreated
}