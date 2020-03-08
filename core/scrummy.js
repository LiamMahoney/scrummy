const { project, milestone } = require('./hooks');

/**
 * The main controller of the program. This function decides
 * what type of hook was returned and passed the data to the 
 * appropriate part of the program to handle the data.
 * 
 * @param {string} type: webhook type that was recieved
 * @param {object} data: post data from webhook
 */
function scrummy(type, data) {
    return new Promise((resolve, reject) => {
        console.debug(`scrummy recieved hook with type: ${type}`);
        switch (type) {
            case 'project':
                resolve(project(data));
                break;
            case 'milestone':
                resolve(milestone(data));
                break;
            default:
                return;
        }
    });
}

module.exports = {
    scrummy
}