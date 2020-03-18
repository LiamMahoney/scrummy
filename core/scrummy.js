const { project, milestone, projectCard } = require('./hooks');

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
        console.debug(`scrummy recieved hook with type: ${type} and action ${data.action}`);
        switch (type) {
            case 'project':
                project(data).then((response) => {
                    return resolve(response);
                }).catch((err) => {
                    return reject(err);
                });
                break; //FIXME: is this redundant
            case 'milestone':
                milestone(data).then((response) => {
                    return resolve(response);
                }).catch((err) => {
                    return reject(err);
                });
                break; // FIXME: is this redundant
            case 'project_card':
                projectCard(data).then((response) => {
                    return resolve(response);
                }).catch((err) => {
                    return reject(err);
                });
                break; // FIXME: is this redundant?
            default:
                return;
        }
    });
}

module.exports = {
    scrummy
}