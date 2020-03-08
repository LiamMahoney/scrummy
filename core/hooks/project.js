const { Label } = require('../actions');

/**
 * Figures out which action is needed based on the github proejct webook
 * recieved. This function only deals with project webhooks. Actions 
 * are decided based on the data.action (what happened in github).
 * 
 * @param {Object} data: github webhook json data
 */
function project(data) {
    return new Promise((resolve, reject) => {
        
        let repo = {
            owner: data.repository.owner.login,
            name: data.repository.name
        }

        switch (data.action) {
            case 'created':
                resolve(Label.createLabel("project", data.project.name.toLowerCase(), repo));
                break;
        }
    });
}

module.exports = {
    project
}