const { project, milestone, projectCard } = require('./hooks');

/**
 * The main controller of the program. This function decides
 * what type of hook was sent and passes the data to the 
 * appropriate part of the program to appropriately respond
 * to what was done.
 * 
 * @param {string} type: webhook type that was recieved
 * @param {object} data: post data from webhook
 */
function scrummy(type, data) {
    try {
        console.debug(`scrummy recieved hook with type: ${type} and action ${data.action}`);
        switch (type) {
            case 'project':
                return await project(data);
            case 'milestone':
                return await milestone(data);
            case 'project_card':
                return await projectCard(data);
            default:
                return;
        }
    } catch (err) {
        throw err;
    }
}

module.exports = {
    scrummy
}