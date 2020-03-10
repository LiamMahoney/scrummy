const { Label, Issue, Project } = require('../actions');

/**
 * 
 * @param {*} data 
 */
function issueAddedToProject(data) {
    return new Promise((resolve, reject) => {
        if (data.project_card.content_url) {
            // making sure it's an issue and not just a project card (only issues have content_url)
            Project.getProject(data.project_card.project_url).then((response) => {
                let projectName = response.data.name;
                //TODO: left off here.
            });
        } else {
            // not an issue, nothing to do
            // TODO: is this empty resolve needed? probably not?
            return resolve();
        }
    });
}

module.exports = {
    issueAddedToProject
}