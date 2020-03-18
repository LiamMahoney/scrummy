const { Issue } = require('../states');

/**
 * 
 * @param {*} data 
 */
function projectCard(data) {
    return new Promise((resolve, reject) => {

        switch (data.action) {
            case 'created':
                // issue added to project or standalone project card created
                Issue.issueAddedToProject(data).then((response) => {
                    return resolve(response);
                }).catch((err) => {
                    return reject(err);
                });
                break; // FIXME: redundant?
            case 'moved':
                // issue is moved in project
                Issue.issueMovedProjectColumn(data).then((response) => {
                    return resolve(response);
                }).catch((err) => {
                    return reject(err);
                });
                break; // FIXME: I think this is redundant...?
        }   
    });
}

module.exports = {
    projectCard
}