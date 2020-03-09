const { Project } = require('../states');

/**
 * Figures out which action is needed based on the github proejct webook
 * recieved. This function only deals with project webhooks. Actions 
 * are decided based on the data.action (what happened in github).
 * 
 * @param {Object} data: github webhook json data
 */
function project(data) {
    return new Promise((resolve, reject) => {
        switch (data.action) {
            case 'created':
                resolve(Project.projectCreated(data));
                break;
        }
    });
}

module.exports = {
    project
}