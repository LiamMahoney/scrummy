const { Label } = require('../actions');

/**
 * Creates a new 'project: <project>' label with the name
 * of the project just created.
 * 
 * @param {JSON} data: Github webhook data 
 */
function newProjectCreated(data) {
    return new Promise((resolve, reject) => {
        let repo = {
            owner: data.repository.owner.login,
            name: data.repository.name
        }

        resolve(Label.createLabel("project", data.project.name.toLowerCase(), repo));
    });
}

module.exports = {
    newProjectCreated
}