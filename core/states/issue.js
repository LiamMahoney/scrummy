const { Label, Issue, Project } = require('../actions');

/**
 * 
 * @param {*} data 
 */
function issueAddedToProject(data) {
    return new Promise((resolve, reject) => {
        if (data.project_card.content_url) {
            // making sure it's an issue and not just a project card (only issues have content_url)
            let projectDetailsProm = Project.getProject(data.project_card.project_url);
            let repoLabelsProm = Label.getAllRepositoryLabels({
                owner: data.repository.owner.login,
                name: data.repository.name
            });
            let issueDetailsProm = Issue.getIssue(data.project_card.content_url);
            let repoDataProm = new Promise((resolve, reject) => {
                resolve({
                    owner: data.repository.owner.login,
                    name: data.repository.name
                });
            })

            return Promise.all([projectDetailsProm, repoLabelsProm, issueDetailsProm, repoDataProm]).then(([projectDetails, repoLabels, issueDetails, repoData]) => {
                let projectName = projectDetails.data.name;
                
                // getting the label name 
                for (label of repoLabels.data) {
                    // parsing the 'project: ' portion out of 'project: <project>' from the label
                    let labelProject = label.name.substr(label.name.indexOf(":") + 1).trim();
                    if (labelProject === projectName.toLowerCase().trim()) {
                        // match between project label and project the issue was added to, adding 'project: <project>' label to the issue
                        return resolve(Label.addLabelsToIssue([label.name], issueDetails.data.number, repoData));
                    }
                }

                return reject(new Error(`no label found for project ${projectName}`));
            });
        }
    });
}

module.exports = {
    issueAddedToProject
}