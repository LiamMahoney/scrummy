const { Project } = require('../states');

/**
 * Figures out which action is needed based on the github proejct webook
 * recieved. This function only deals with project webhooks. Actions 
 * are decided based on the data.action (what happened in github).
 * 
 * @param {Object} data: github webhook json data
 */
function project(data) {
    try {
        switch (data.action) {
            case 'created':
                return await Project.projectCreated(data);
        }
    } catch (err) {
        throw err;
    }
}

module.exports = {
    project
}