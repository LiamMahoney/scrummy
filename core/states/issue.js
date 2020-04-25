const { Label, Issue, Project, ProjectCard } = require('../actions');
const { MissingProjectLabel, OutOfSync } = require('../../utils/errors');
const request = require('../../utils/request');

/**
 * Adds the matching `project: <project>` label that the 
 * issue was just added to and moves the project card
 * to the proper column, if needed.
 * 
 * @param {Object} data webhook payload
 */
async function projectCardCreated(data) {
    try {
        // checking that the project card is an instance of an issue
        // only project cards that are instances of issues have the content_url field
        if (data.project_card.content_url) {
            // have to remove '{/number}' from the URL
            let milestoneURL = data.repository.milestones_url.substr(0, data.repository.milestones_url.indexOf("{/number}"));
            
            if (await isProjectMilestone(milestoneURL, data.project_card.project_url)) {
                return await milestoneProjectCardCreated(data);
            } else {
                return await normalProjectCardCreated(data);
            }
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Determines if the project is assosciated to a milestone.
 *
 * @param {String} milestonesURL URL to get all of the milestones in the repositoory
 * @param {String} projectURL URL to get a single project
 * @returns {Boolean} true if the project is associated to a milestone, false if it is not
 */
async function isProjectMilestone(milestonesURL, projectURL) {
    try {
        let proms = [];

        proms.push(request.genericGet(milestonesURL));
        proms.push(request.genericProjectGet(projectURL));

        let [milestones, project] = await Promise.all(proms);

        for (milestone of milestones) {
            if (milestone.title.trim().toLowerCase() === project.name.toLowerCase().trim()) {
                // project associated to milestone
                return true
            }
        }

        return false;

    } catch (err) {
        throw err;
    }
}

/**
 * Makes sure the project card was added to the correct column in the 
 * milestone project.
 *
 * @param {Object} data project_card webook
 */
async function milestoneProjectCardCreated(data) {
    try {
        let issue = await Issue.getIssue(data.project_card.content_url);

        return await findNewProjectCardStage(issue, data.project_card.node_id, data.project_card.project_url, data.project_card.column, data.repository.owner.login, data.repository.name);
    } catch (err) {
        throw err;
    }
}

/**
 * Adds the appropriate 'project: <project>' label and makes sure the 
 * project card is in the right column.
 *
 * @param {Object} data projet_card webhook
 */
async function normalProjectCardCreated(data) {
    try {
        let proms = [];

        proms.push(Issue.getIssue(data.project_card.content_url));
        proms.push(findProjectLabel(data.project_card.project_url, data.repository.owner.login, data.repository.name));
       
        let [issue, labelToAdd] = await Promise.all(proms);
        
        proms = [];

        // adding project label if there is one
        proms.push(Issue.addLabels(issue.number, [labelToAdd.name], data.repository.owner.login, data.repository.name));

        // moving project card, if needed
        proms.push(findNewProjectCardStage(issue, data.project_card.node_id, data.project_card.project_url, data.project_card.column, data.repository.owner.login, data.repository.name));

        return await Promise.all(proms);
    } catch (err) {
        throw err;
    }
}

/**
 * Finds the stage the new project card should be in based on whether
 * or not the project card's issue already has a stage label.
 * 
 * @param {Object} issue response from issue.getIssue()
 * @param {String} projectCardID the node ID of a project card
 * @param {String} projectURL API GET URL for a project
 * @param {String} columnURL API GET URL for a column
 * @param {String} repoOwner the owner of the repository to look in
 * @param {String} repoName the name of the reposiotory to look in
 * 
 */
async function findNewProjectCardStage(issue, projectCardID, projectURL, columnURL, repoOwner, repoName) {
    try {
        let stageLabels = await findCurrentLabel(issue.labels, "stage");

        if (stageLabels.length === 1) {
            // issue already has a stage label, need to move the new project card to the correct column
            return await moveProjectCardToIssuesStage(stageLabels[0], projectURL, issue.number, projectCardID);
        } else if (stageLabels.length === 0) {
            // issue doesn't have any stage labels, add the stage label the proect card is in
            
            // appropriate stage label to add based on the column the project card is in
            let label = await findStageLabel(columnURL, repoOwner, repoName);

            return await Issue.addLabels(issue.number, [label.name], repoOwner, repoName);
        } else {
            // issue has multiple stage labels - this should never happen
            throw new Error(`Found the following stage labels on issue #${issue.number}: [${stageLabels.join(', ')}]`);
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Moves the project card to the column in the project that matches the given
 * stage label.
 * 
 * @param {String} stageLabel stage label to find a column of
 * @param {String} projectURL http url for a GET project details request
 * @param {int} issueNumber the project card's associated issue number
 * @param {String} projectCardID the node ID of a project card
 * @returns {String} statement to log describing which column the project card was moved to
 */
async function moveProjectCardToIssuesStage(stageLabel, projectURL, issueNumber, projectCardID) {
    try {

        let project = await Project.getProject(projectURL);
        let columns = await Project.getColumn(project.columns_url); //FIXME: misusing this function....

        for (column of columns) {
            // looking for column part of stage label - stage: <column>
            let stage = stageLabel.substr(stageLabel.indexOf(':') + 1).trim().toLowerCase();

            if (stage === column.name.toLowerCase().trim()) {
                // found column to move project card to
                await ProjectCard.moveProjectCard(projectCardID, column.node_id);

                return `moved project card for #${issueNumber} in '${project.name}' to column '${column.name}'`;
            }
        }

        throw new Error(`Couldn't find column matching the label '${stageLabel}' in the project '${project.name}'. Can't move the project card for issue #${issueNumber} in the project.`);
    } catch (err) {
        throw err;
    }
}

/**
 * Checks if hte project card that was deleted was from a milestone project.
 * If it is not a milestone project then removes the matching project label
 * from the project card's issue.
 * 
 * @param {Object} data webhook payload
 */
async function projectCardDeleted(data) {
    try {
        // checking that the project card is an instance of an issue
        if (data.project_card.content_url) {
            let milestoneURL = data.repository.milestones_url.substr(0, data.repository.milestones_url.indexOf("{/number}"));

            // there aren't any project labels for milestones
            if (!await isProjectMilestone(milestoneURL, data.project_card.project_url)) {
                return await normalProjectCardDeleted(data.project_card.project_url, data.project_card.content_url, data.repository.owner.login, data.repository.name);
            }
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Removes the 'project: <project>' label that the issue was just removed
 * from.
 * 
 * @param {String} projectURL GET project API url
 * @param {String} issueURL GET issue API url
 * @param {String} repoOwner the repository owner's login
 * @param {String} repoName the name of the repository
 */
async function normalProjectCardDeleted(projectURL, issueURL, repoOwner, repoName) {
    try {
        let proms = [];
        proms.push(Issue.getIssue(issueURL));
        proms.push(findProjectLabel(projectURL, repoOwner, repoName));

        let [issue, labelToRemove] = await Promise.all(proms);

        // removing project label
        return await Issue.removeLabel(issue.number, [labelToRemove.name], repoOwner, repoName);
    } catch (err) {
        throw err;
    }
}

/**
 * Adds the matching `<project>: project` and `<stage>`: stage
 * labels to the issue. Adds the project and the stage where
 * the project card was converted.
 * 
 * @param {Object} data webhook payload
 */
async function projectCardConverted(data) {
    try {
        let proms = [];
        proms.push(Issue.getIssue(data.project_card.content_url));
        proms.push(findProjectLabel(data.project_card.project_url, data.repository.owner.login, data.repository.name));
        proms.push(findStageLabel(data.project_card.column_url, data.repository.owner.login, data.repository.name));

        let [issue, projectLabel, stageLabel] = await Promise.all(proms);

        // adding stage label and project label to the issue
        return await Issue.addLabels(issue.number, [projectLabel.name, stageLabel.name], data.repository.owner.login, data.repository.name);

    } catch (err) {
        throw err;
    }
}

/**
 * Finds the matching `project: <project>` for the project
 * the project card (instance of issue) was just added to
 * or removed from.
 * 
 * @param {String} proejctURL URL to get project
 * @param {String} repoOwner owner of the github repository
 * @param {String} repoName name of the repository
 * @returns {Object} describes the matching project label
 * to add or remove with name and id keys
 */
async function findProjectLabel(projectURL, repoOwner, repoName) {
    try {
        proms = [];
        proms.push(Label.getAllLabels(repoOwner, repoName));
        // TODO: delete Project.getProject and replace with request.genericGet
        proms.push(Project.getProject(projectURL));

        let [labels, project] = await Promise.all(proms);

        return await matchLabel('project:', project.name, labels);

    } catch (err) {
        throw err;
    }
}

/**
 * Finds the matching `stage: <stage>` for the project
 * the project card (instance of issue) is currently in.
 * 
 * FIXME: if I create a general 'get url' request (rather than having 2 identical methods in Project.getProject and Project.getColumn) then I can combine this method and the findProjectLabel method.
 * 
 * @param {String} columnURL API GET column URL
 * @param {String} repoOwner the owner of the repository to look in
 * @param {String} repoName the name of the repository to look in
 * @returns {Object} describes the matching project label
 * to add or remove with name and id keys
 */
async function findStageLabel(columnURL, repoOwner, repoName) {
    try {
        proms = [];
        proms.push(Label.getAllLabels(repoOwner, repoName));
        proms.push(Project.getColumn(columnURL));

        let [labels, column] = await Promise.all(proms);

        return await matchLabel('stage:', column.name, labels);

    } catch (err) {
        throw err;
    }
}

/**
 * Finds a matching `type: <value>` label for the 
 * project name passed in.
 * 
 * @param {string} type the type of label to match, first part of the label
 * @param {string} value the value of the label to match, second part of the github label
 * @param {Object} labels actions.Label.getAllLabels() response
 * @returns {Object} matching `project: <project>` label name/id
 */
async function matchLabel(type, value, labels) {
    try {
        //TODO: should the first 3 lines of findStageLabel and findProjectLabel be placed here? Would
        // replace this function's parameters with type, columnURL, repoOwner, and repo.

        for (label of labels) {
            if (label.name.replace(type, '').trim().toLowerCase() === value.toLowerCase()) {
                return {
                    name: label.name,
                    id: label.id
                }
            }
        }

        throw new MissingProjectLabel(`'${type} <${type}>' label not found for ${type} '${value}'`);

    } catch (err) {
        throw err;
    }
}

/**
 * Determines action to be done based on what type of 
 * label was added to the issue.
 * 
 * @param {Object} data webhook payload
 */
async function issueLabeled(data) {
    try {
        let labelType = data.label.name.substr(0, data.label.name.indexOf(":")).toLowerCase();

        switch(labelType) {
            case 'stage':
                return await stageLabelAddedToIssue(data);
            case 'project':
                return await projectLabelAddedToIssue(data);
        }
    } catch (err) { 
        throw err;
    }
}

/**
 * Moves all of the issue's associated project cards to
 * the proper column and removes the old stage label.
 * 
 * @param {Object} data webhook payload
 */
async function stageLabelAddedToIssue(data) {
    try {
        let proms = [];

        proms.push(removeOldStageLabel(data.label.name, data.issue.labels, data.issue.number, data.repository.owner.login, data.repository.name));
        proms.push(moveAllIssueProjectCards(data.label.name, data.issue.number, data.repository.owner.login, data.repository.name));

        return await Promise.all(proms);

    } catch(err) {
        throw err;
    }
}

/**
 * Removes the old stage label from the issue.
 * 
 * @param {String} newStageLabel the new stage label that was added 
 * @param {Array} issueLabels list of objects representing the labels the issue is labeled with
 * @param {int} issue Github issue number
 * @param {String} repoOwner GitHub login of the owner of the repo
 * @param {String} repoName name of the respository
 */
async function removeOldStageLabel(newStageLabel, issueLabels, issue, repoOwner, repoName) {
    try {
        for (label of issueLabels) {
            // boolean whether or not label starts with stage
            let isStageLabel = label.name.substr(0, label.name.indexOf(":")).toLowerCase() === "stage";

            // finding the old stage label
            if (isStageLabel && label.name !== newStageLabel) {
                return await Issue.removeLabel(issue, label.name, repoOwner, repoName);
            }
        }

        return `old 'stage' label not found in issue #${issue}`;
    } catch(err) {
        throw err;
    }
}

/**
 * 
 * 
 * @param {String} newStageLabel the new stage label that was added 
 * @param {int} issueNumber Github issue number 
 * @param {String} repoOwner Github login of the owner of the repo
 * @param {String} repoName name of the repository
 */
async function moveAllIssueProjectCards(newStageLabel, issueNumber, repoOwner, repoName) {
    try {
        let issueCards = await Issue.getIssueProjectCards(issueNumber, repoOwner, repoName);

        let stage = newStageLabel.substr(newStageLabel.indexOf(":") + 1).trim().toLowerCase();

        let proms = [];

        for (projectCard of issueCards.data.repository.issue.projectCards.edges) {
            // only moving project cards in projects that are open
            if (projectCard.node.project.state === "OPEN") {
                proms.push(moveIssueProjectCard(stage, projectCard.node));
            }
        }

        return await Promise.all(proms);
    } catch(err) {
        throw err;
    }
}

/**
 * Moves the project card to the correct column/stage.
 * 
 * @param {String} stage the name of the stage to move the project card to
 * @param {Object} projectCard an object representing a project card from the method Issue.getIssueProjectCards
 */
async function moveIssueProjectCard(stage, projectCard) {
    try {
        if (await isProjectCardInRightColumn(stage, projectCard.column.name)) {
            return `projectCard '${projectCard.id}' is already in the correct column '${stage}'`;
        } else {
            let columnID = await findProjColumnFromStageName(stage, projectCard.project.columns.edges, projectCard.project.name);

            await ProjectCard.moveProjectCard(projectCard.id, columnID);

            return `moved project card ${projectCard.id} to column '${stage}' in project '${projectCard.project.name}'`;
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Determines if the project card is already in the column passed into the function.
 * 
 * @param {String} stage the name of the stage/column to check if the project card is in
 * @param {String} projectCardStage the name of the stage/column the project card is in
 */
async function isProjectCardInRightColumn(stage, projectCardStage) {
    try {
        if (stage.toLowerCase().trim() === projectCardStage.toLowerCase().trim()) {
            return true
        } else {
            return false
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Finds the column ID for the column with the name specified
 * in the parameters. 
 * 
 * @param {String} stage the name of the stage to find the ID of
 * @param {Array} columns list of project columns in a project
 * @param {String} project the name of the project to look in
 */
async function findProjColumnFromStageName(stage, columns, project) {
    try {
        for (column of columns) {
            if (column.node.name.trim().toLowerCase() === stage) {
                return column.node.id;
            }
        }

        throw new Error(`didn't find a column with the name ${stage} in the project ${project}`);
    } catch (err) {
        throw err;
    }
}

/**
 * Creates a project card in the matching project as the 'project: <project>'
 * label that was just added to the issue. Checks if issue already has a
 * project card in that project first.
 * 
 * @param {Object} data issue webhook payload 
 */
async function projectLabelAddedToIssue(data) {
    try {
        // getting the project that was just added to the issue
        let projectAddedTo = data.label.name.substr(data.label.name.indexOf(":") + 1).trim().toLowerCase();

        if (! await isIssueInProject(data.issue.number, projectAddedTo, data.repository.owner.login, data.repository.name)) {
            let projects = await Project.getRepoProjects(data.repository.owner.login, data.repository.name);

            // finding project with the same name as the project label that was added to the issue
            for (project of projects) {
                if (project.name.toLowerCase().trim() === projectAddedTo) {
                    let columns = await Project.getProjectColumns(project.columns_url);
    
                    for (column of columns) {
                        //FIXME: think of a better way to identify a project column to add the project card to
                        if (column.name.trim().toLowerCase() === "to do") {
                            return await Issue.addIssueToProject(data.issue.number, project.name, column.id, data.issue.id, "Issue");
                        }
                    }
                }
            }
    
            return `couldn't match the label '${data.label.name}' to a project in the repository ${data.repository.name}. Issue #${data.issue.number} was not added to the associated project`;
        }

        return `the issue #${data.issue.number} already has a project card in the project '${projectAddedTo}'`;

    } catch (err) { 
        throw err;
    }
}

/**
 * Chceks if the issue has a project card in a certain project.
 * 
 * @param {int} issueNumber the github issue number 
 * @param {String} projectName the name of the project
 * @param {String} repoOwner the owner of the repo
 * @param {String} repoName the name of the repository
 */
async function isIssueInProject(issueNumber, project, repoOwner, repoName) {
    try {
        let projectCards = await Issue.getIssueProjectCards(issueNumber, repoOwner, repoName);

        // searching for project card that matches the label just removed from the issue
        for (projectCard of projectCards.data.repository.issue.projectCards.edges) {
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
 * Checks if the stage label on the projet card's issue matches
 * the column the project card was moved to. If it doesn't then
 * gets the proper stage label for the column and adds it 
 * to the project card's issue. Adding the stage label will take
 * care of moving teh rest of the issue's proejct cards and 
 * removing the old stage label on the issue.
 * 
 * @param {Object} data project card webhook payload
 */
async function projectCardMoved(data) {
    try {
        let proms = [];

        proms.push(Project.getColumn(data.project_card.column_url));
        proms.push(Project.getProject(data.project_card.content_url));

        let [column, issue] = await Promise.all(proms);

        if (await projectCardNeedsToMove(column, issue)) {
            // the stage label that should be added to the project based on the column the project card is in 
            let newStageLabel = await findStageLabel(data.project_card.column_url, data.repository.owner.login, data.repository.name);

            // adding the proper stage label to the project card's associated issue - this will
            // trigger the stage label added to issue which will move the rest of the project cards
            // and remove the old stage: <stage> label from the issue.
            return await Issue.addLabels(issue.number, [newStageLabel.name], data.repository.owner.login, data.repository.name);
        }

    } catch (err) {
        throw err;
    }
}

/**
 * Determines if the project card needs to move by comparing
 * the stage label on the project card's issue and the column
 * name the project card was just moved to. If they don't match
 * then the project card needs to be moved.
 * 
 * @param {Object} column GET column response from REST api
 * @param {Object} issue GET issue response from REST api
 */
async function projectCardNeedsToMove(column, issue) {
    try {
        let stageLabels = await findCurrentLabel(issue.labels, 'stage');

        if (stageLabels.length > 1) {
            throw new Error(`issue #${issue.number} has multiple stage labels associated to it`);
        } else if (stageLabels.length === 0) {
            // there is no stage label on the project card's issue so the 
            // new one should be added
            return true;
        }

        // stageLabels.length === 1
        let stage = stageLabels[0].substr(stageLabels[0].indexOf(":") + 1).toLowerCase().trim()

        // returning the opposite of whether or not the project card is in the right column
        return ! await isProjectCardInRightColumn(column.name, stage);
    } catch (err) {
        throw err;
    }
}

/**
 * Returns any labels that match the type.
 * 
 * @param {Array} labels list of objects that represent labels
 * @param {String} type the type of label to look for [stage, project]
 */
async function findCurrentLabel(labels, type) {
    try {
        // holds labels that match the type
        matching = [];

        for (label of labels) {
            if (label.name.indexOf(type.toLowerCase().trim()) !== -1) {
                matching.push(label.name);
            }
        }

        return matching
    } catch (err) {
        throw err;
    }
}

/**
 * Determines what needs to be done based on the type of label
 * that was removed from the issue.
 * 
 * @param {Object} data webhook payload
 */
async function issueUnlabeled(data) {
    try {
        let labelType = data.label.name.substr(0, data.label.name.indexOf(":")).toLowerCase();

        switch(labelType) {
            case 'project':
                return await projectLabelRemovedFromIssue(data);
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Finds the project card associated to the issue that is in the project 
 * that matches the project label that was just removed from the issue. 
 * Removes the matching project from the issue (deletes the project card).
 * 
 * @param {Object} data webhook payload
 */
async function projectLabelRemovedFromIssue(data) {
    try {
        // name of the project to remove from the issue from a 'project: <project>' label
        let projectToRemove = data.label.name.substr(data.label.name.indexOf(':') + 1).trim().toLowerCase();

        let projectCards = await Issue.getIssueProjectCards(data.issue.number, data.repository.owner.login, data.repository.name);
        
        // searching for project card that matches the label just removed from the issue
        for (projectCard of projectCards.data.repository.issue.projectCards.edges) {
            if (projectCard.node.project.name.toLowerCase().trim() === projectToRemove) {
                await ProjectCard.deleteProjectCard(projectCard.node.databaseId);

                return `removed #${data.issue.number} from '${projectCard.node.project.name}'`;
            }
        }

        // didn't find a project card in the project desired
        throw new Error(`couldn't find a project card for issue #${data.issue.number} that matches the label '${data.label.name}'`);

    } catch (err) {
        throw err;
    }
}

/**
 * Adds the issue to the project board that corresponds to the milestone it was
 * just added to. The project card gets placed in the first (left most) column 
 * in the project.If the project card needs to be placed in a different column,
 * it will be handeled by the hook 'project_card' and the action 'created'.
 * 
 * @param {Object} data webhook payload
 */
async function issueMilestoned(data) {
    try {
        let projects = await Project.getRepoProjects(data.repository.owner.login, data.repository.name);

        // searching for project with the same name as the milestone
        for (project of projects) {
            if (project.name === data.milestone.title) {
                let columns = await Project.getProjectColumns(project.columns_url);

                // adding to left most (first) column in project
                await Issue.addIssueToProject(data.issue.number, project.name, columns[0].id, data.issue.id, "Issue");

                return `project card for #${data.issue.number} created in the milestone project '${project.name}'`;
            }
        }
    } catch (err) {
        throw err;
    }
}

/**
 * Finds and deletes the issue's project card in the milestone project is was
 * just removed from if the project is still active.
 * 
 * @param {Object} data issue webhook payload 
 */
async function issueDemilestoned(data) {
    try {
        let projectCards = await Issue.getIssueProjectCards(data.issue.number, data.repository.owner.login, data.repository.name);

        // finding project card in the milestone project the issue was just removed from and chceking the project is open
        for (projectCard of projectCards.data.repository.issue.projectCards.edges) {
            if (projectCard.node.project.name.toLowerCase().trim() === data.milestone.title.toLowerCase().trim()) {
                // don't want to remove project cards from closed milestone projects
                if (projectCard.node.project.state.toLowerCase() === "open") {
                    // deleting the project card in the active milestone project
                    await ProjectCard.deleteProjectCard(projectCard.node.databaseId);

                    return `removed project card for #${data.issue.number} from '${projectCard.node.project.name}'`;
                } else {
                    return `project card for #${data.issue.number} not touched in '${projectCard.node.project.name}' becuase the project is closed`;
                }
            }
        }

        // a project card in the milestone project wasn't found
        throw OutOfSync(`issue #${data.issue.number} was missing a project card in the milestone project '${data.milestone.title}'`);
    } catch (err) {
        throw err;
    }
}

module.exports = {
    projectCardCreated,
    projectCardDeleted,
    projectCardConverted,
    issueLabeled,
    projectCardMoved,
    issueUnlabeled,
    issueMilestoned,
    issueDemilestoned,
    isProjectMilestone
}