let issueState = require('./issue');
let { Project, Issue, PullRequest, ProjectCard } = require('../actions');

/**
 * Determines action to be done based on what type of 
 * label was added to the issue.
 * 
 * @param {Object} data pull request webhook payload 
 */
async function pullRequestLabeled(data) {
    try {
        let labelType = data.label.name.substr(0, data.label.name.indexOf(":")).toLowerCase();

        switch(labelType) {
            case 'stage':
                return await stageLabelAddedToPullRequest(data);
            case 'project':
                return await projectLabelAddedToPullRequest(data);
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Moves all of the PR's associated project cards to
 * the proper column and removes the old stage label.
 * 
 * @param {Object} data pull request webhook payload
 */
async function stageLabelAddedToPullRequest(data) {
    try {
        let proms = [];

        proms.push(issueState.removeOldStageLabel(data.label.name, data.pull_request.labels, data.pull_request.number, data.repository.owner.login, data.repository.name));
        proms.push(issueState.moveAllIssueProjectCards(data.label.name, data.pull_request.number, 'Pull Request', data.repository.owner.login, data.repository.name));

        return await Promise.all(proms);
    } catch (err) {
        throw err;
    }
}


/**
 * Creates a project card in the matching project as the 'project: <project>'
 * label that was just added to the pull request. Checks if the PR already has
 * a project card in that project first.
 * 
 * FIXME: Pretty much the same as Issue.projectLabelAddedToIssue
 * 
 * @param {Object} data pull request webhook payload 
 */
async function projectLabelAddedToPullRequest(data) {
    try {
        // getting the project that was just added to the PR
        let projectAddedTo = data.label.name.substr(data.label.name.indexOf(":") + 1).trim().toLowerCase();

        if (!await isPRInProject(data.pull_request.number, projectAddedTo, data.repository.owner.login, data.repository.name)) {
            let projects = await Project.getRepoProjects(data.repository.owner.login, data.repository.name);

            // finding project with the same name as the project label that was added to the issue
            for (project of projects) {
                if (project.name.toLowerCase().trim() === projectAddedTo) {
                    let columns = await Project.getProjectColumns(project.columns_url);
    
                    return await Issue.addIssueToProject(data.pull_request.number, project.name, columns[0].id, data.pull_request.id, "PullRequest");
                }
            }
    
            return `couldn't match the label '${data.label.name}' to a project in the repository ${data.repository.name}. Issue #${data.issue.number} was not added to the associated project`;
        }

        return `the issue #${data.pull_request.number} already has a project card in the project '${projectAddedTo}'`;
    } catch (err) {
        throw err;
    }
}

/**
 * Chceks if the issue has a project card in a certain project.
 * 
 * @param {int} prNumber the github issue number 
 * @param {String} projectName the name of the project
 * @param {String} repoOwner the owner of the repo
 * @param {String} repoName the name of the repository
 */
async function isPRInProject(prNumber, project, repoOwner, repoName) {
    try {
        let projectCards = await PullRequest.getProjectCards(prNumber, repoOwner, repoName);

        // searching for project card that matches the label just removed from the issue
        for (projectCard of projectCards.data.repository.pullRequest.projectCards.edges) {
            if (projectCard.node.project.name.toLowerCase().trim() === project.toLowerCase().trim()) {
                return true;
            }
        }

        return false;

    } catch (err) {
        throw err;
    }
}

/**
 * Determines what needs to be done based on the type of label
 * that was removed from the issue.
 * 
 * @param {Object} data Pull request webhook payload
 */
async function PullRequestUnlabeled(data) {
    try {
        let labelType = data.label.name.substr(0, data.label.name.indexOf(":")).toLowerCase();

        switch(labelType) {
            case 'project':
                return await projectLabelRemovedFromPR(data);
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Finds the project card associated to the PR that is in the project 
 * that matches the project label that was just removed from the PR. 
 * Removes the matching project from the PR (deletes the project card).
 * 
 * @param {Object} data Pull request webhook payload
 */
async function projectLabelRemovedFromPR(data) {
    try {
        // name of the project to remove from the issue from a 'project: <project>' label
        let projectToRemove = data.label.name.substr(data.label.name.indexOf(':') + 1).trim().toLowerCase();

        let projectCards = await PullRequest.getProjectCards(data.pull_request.number, data.repository.owner.login, data.repository.name);

        // searching for project card that matches the label just removed from the PR
        for (projectCard of projectCards.data.repository.pullRequest.projectCards.edges) {
            if (projectCard.node.project.name.toLowerCase().trim() === projectToRemove) {
                await ProjectCard.deleteProjectCard(projectCard.node.databaseId);

                return `removed #${data.pull_request.number} from '${projectCard.node.project.name}'`;
            }
        }

        return `Project card for #${data.pull_request.number} in '${data.label.name}' was already deleted`;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    pullRequestLabeled,
    PullRequestUnlabeled
}