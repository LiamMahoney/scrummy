const { milestone, issues, project } = require('./hooks');

/**
 * The main controller of the program. This function decides
 * what type of hook was returned and passed the data to the 
 * appropriate part of the program to handle the data.
 * 
 * @param {string} type: webhook type that was recieved
 * @param {object} data: post data from webhook
 */
function scrummy(type, data) {
    console.debug(`scrummy recieved hook with type: ${type}`);
    switch (type) {
        case 'milestone':
            milestone(data);
            break;
        case 'issues':
            issues(data);
            break;
        case 'project':
            project(data);
            break;
        default:
            return;
    }
}

module.exports = {
    scrummy
}