const { Label, Issue, Project, ProjectCard } = require('../actions');

/**
 * TODO:
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
            }).catch((err) => {
                return reject(err);
            });
        }
    });
}

/**
 * TODO:
 * 
 * @param {*} data 
 */
async function issueMovedProjectColumn(data) {
        let issueDetails = await Issue.getIssue(data.project_card.content_url);
        let repoData = {
            owner: data.repository.owner.login,
            name: data.repository.name
        }   
        let [repoLabels, issueProjectCards, column] = await Promise.all([Label.getAllRepositoryLabels(repoData), Issue.getIssueProjectCards(issueDetails.data.number,repoData), Project.getProjectColumn(data.project_card.column_url)]) ;

        return await Promise.all([moveProjectCards(issueProjectCards.data.data.repository.issue.projectCards.edges, column.name), addStageLabelToIssue(column.name, repoLabels, issueDetails, repoData)]);
}

/**
 * 
 * @param {Object} projectCards: list of project card objects that contain all of the project columns in the project of the project_card - response.data.data.repository.issue.projectCards.edges
 * @param {string} columnName: name of the column to move the project cards to
 */
function moveProjectCards(projectCards, columnName) {
    return new Promise((resolve, reject) => {
        let promList = [];

        for (proj of projectCards) {
            matchProjectColumnID(proj.node.project, columnName).then((response) => {
                let projectCardID = Buffer.from(proj.node.id, 'base64').toString('utf-8');
                let columnId = Buffer.from(response, 'base64').toString('utf-8');
                promList.push(ProjectCard.moveProjectCard(projectCardID.substr(projectCardID.indexOf('d') + 1), "bottom", columnId.substr(columnId.indexOf('n') + 1)));
            }).catch((err) => {
                return reject(err);
            });
        }

        return resolve(Promise.all(promList));

    });
}


/**
 * Checks for a label that exists with the name stage: columnName. If it does exi
 * 
 * @param {Object} columnName the column name to add a label of
 * @param {Array} repoLabels all of the labels in the repo
 * @param {Object} issueDetails details about the issue to add / remove labels from 
 * @param {Object} repoData {owner: <repo owner login>, name: <repo name>}
 */
async function addStageLabelToIssue(columnName, repoLabels, issueDetails, repoData) {
    try {
        let labelName = await matchColumnToLabel(columnName, repoLabels.data);
        // TODO: Need to pass the old stage: <stage> label to removeLablFromProject, not the label to add! 
        return await Promise.all([Label.removeLabelFromProject(labelName, issueDetails.data.number, repoData), Label.addLabelsToIssue([labelName], issueDetails.data.number, repoData)]);
    } catch (err) {
        return err;
    }
}


/**
 * Gets the project column id for the corresponding project column name
 * 
 * @param {Array} projectData project data from getissueProjectCards
 * @param {String} name name of the project column we're looking for
 * @returns corresponding project column id
 */
function matchProjectColumnID(projectData, name) {
    return new Promise((resolve, reject) => {
        for (col of projectData.columns.edges) {
            if (col.node.name.toLowerCase() === name.toLowerCase()) {
                return resolve(col.node.id);
            }
        }
        return reject(`didn't find column ${name} in ${projectdata.name}`);
    });
}

/**
 * Matches the column name to a stage: <stage> label.
 * 
 * @param {string} columnName the column name to find a 'stage: <stage>' label for
 * @param {Array} labels a list of columns in the repository
 * @returns The name of the label that corresponds to the column
 */
function matchColumnToLabel(columnName, labels) {
    return new Promise((resolve, reject) => {
        for (label of labels) {
            // checking for stage: <stage> labels
            if (label.name.toLowerCase().indexOf('stage:' !== -1)) {
                if (label.name.toLowerCase().substr(label.name.toLowerCase().indexOf(':') + 1).trim() == columnName.toLowerCase()) {
                    resolve(label.name);
                }
            }
        }
        reject(`stage: <stage> label not found for column ${columnName}`);
    });
}

module.exports = {
    issueAddedToProject,
    issueMovedProjectColumn
}