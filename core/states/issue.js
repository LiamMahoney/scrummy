const { Label, Issue, Project, ProjectCard } = require('../actions');

/**
 * Adds the matching `project: <project>` label that the 
 * issue was just added to.
 * 
 * @param {Object} data webhook payload
 */
async function issueAddedToProject(data) {
    try {
        // checking that the project card is an instance of an issue
        // only project cards that are instances of issues have the content_url field
        if (data.project_card.content_url) {
            let proms = [];
            proms.push(Issue.getIssue(data.project_card.content_url));
            proms.push(findProjectLabel(data));

            let [issue, labelToAdd] = await Promise.all(proms);

            // adding project label
            let resp = await Issue.addLabels(issue.number, [labelToAdd.name], data.repository.owner.login, data.repository.name);

            // getting the labels that were added from the response to form the return statement (what is logged)
            labelsAdded = [];
            for (label of resp) {
                labelsAdded.push(label.name);
            }

            return `added label(s) [${labelsAdded.join(', ')}] to issue #${issue.number}`;
        }
    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Removes the matching `project: <project>` label that the 
 * issue was just removed from.
 * 
 * @param {Object} data webhook payload
 */
async function issueRemovedFromProject(data) {
    try {
        // checking that the project card is an instance of an issue
        // only project cards that are instances of issues have the content_url field
        if (data.project_card.content_url) {
            let proms = [];
            proms.push(Issue.getIssue(data.project_card.content_url));
            proms.push(findProjectLabel(data));

            let [issue, labelToRemove] = await Promise.all(proms);

            // removing project label
            let resp = await Issue.removeLabel(issue.number, [labelToRemove.name], data.repository.owner.login, data.repository.name);

            return `removed label '${labelToRemove.name}' from issue #${issue.number}`;
        }
    } catch (err) {
        throw new Error(err.stack);
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
        proms.push(findProjectLabel(data));
        proms.push(findStageLabel(data));

        let [issue, projectLabel, stageLabel] = await Promise.all(proms);

        // adding stage label and project label to the issue
        let resp = await Issue.addLabels(issue.number, [projectLabel.name, stageLabel.name], data.repository.owner.login, data.repository.name);
        
        // getting the labels that were added from the response to form the return statement (what is logged)
        labelsAdded = [];
        for (label of resp) {
            labelsAdded.push(label.name);
        }

        return `added label(s) [${labelsAdded.join(', ')}] to issue #${issue.number}`;

    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Finds the matching `project: <project>` for the project
 * the project card (instance of issue) was just added to
 * or removed from.
 * 
 * @param {Object} data webhook payload
 * @returns {Object} describes the matching project label
 * to add or remove with name and id keys
 */
async function findProjectLabel(data) {
    try {
        proms = [];
        proms.push(Label.getAllLabels(data.repository.owner.login, data.repository.name));
        proms.push(Project.getProject(data.project_card.project_url));

        let [labels, project] = await Promise.all(proms);

        return await matchLabel(project.name, labels, 'project:');

    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Finds the matching `stage: <stage>` for the project
 * the project card (instance of issue) was just added to
 * or removed from.
 * 
 * FIXME: if I create a general 'get url' request (rather than having 2 identical methods in Project.getProject and Project.getColumn) then I can combine this method and the findProjectLabel method.
 * 
 * @param {Object} data webhook payload
 * @returns {Object} describes the matching project label
 * to add or remove with name and id keys
 */
async function findStageLabel(data) {
    try {
        proms = [];
        proms.push(Label.getAllLabels(data.repository.owner.login, data.repository.name));
        proms.push(Project.getColumn(data.project_card.column_url));

        let [labels, column] = await Promise.all(proms);

        return await matchLabel(column.name, labels, 'stage:');

    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Finds a matching `type: <value>` label for the 
 * project name passed in.
 * 
 * @param {string} labelName 2nd part of the github label to match to
 * @param {Object} labels actions.Label.getAllLabels() response
 * @param {string} type the type of label to match, could be 'project' or 'stage'
 * @returns {Object} matching `project: <project>` label name/id
 */
async function matchLabel(labelName, labels, type) {
    try {
        for (label of labels) {
            if (label.name.replace(type, '').trim().toLowerCase() === labelName.toLowerCase()) {
                return {
                    name: label.name,
                    id: label.id
                }
            }
        }

        throw new Error(`'${type} <${type}>' label not found for ${type} '${labelName}'`);

    } catch (err) {
        throw new Error(err.stack);
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
        }
    } catch (err) { 
        throw new Error(err.stack);
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
        throw new Error(err.stack);
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
                await Issue.removeLabel(issue, label.name, repoOwner, repoName);

                return `removed label '${label.name}' from issue #${issue}`;
            }
        }

        //TODO: should this be an error or not?
        return `old 'stage' label not found in issue #${issue}`;
    } catch(err) {
        throw new Error(err.stack);
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
        throw new Error(err.stack);
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
        throw new Error(err.stack);
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
        throw new Error(err.stack);
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
        throw new Error(err.stack);
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

        if (await projectLabelNeedsToMove(column, issue)) {
            // the stage label that should be added to the project based on the column the project card is in 
            let newStageLabel = await findStageLabel(data);

            // adding the proper stage label to the project card's associated issue - this will
            // trigger the stage label added to issue which will move the rest of the project cards
            // and remove the old stage: <stage> label from the issue.
            await Issue.addLabels(issue.number, [newStageLabel.name], data.repository.owner.login, data.repository.name);

            return `added label '${newStageLabel.name}' to issue #${issue.number}`;
        }

    } catch (err) {
        throw new Error(err.stack);
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
async function projectLabelNeedsToMove(column, issue) {
    try {
        let stageLabels = await findCurrentLabel(issue.labels, 'stage');

        if (stageLabels.length > 1) {
            throw new Error(`issue #${issue.number} has multiple stage labels associated to it`);
        } else if (stageLabels.length === 0) {
            // should return true
            throw new Error(`issue #${issue.number} doesn't have any stage labels associated to it`);
        }

        // stageLabels.length === 1
        let stage = stageLabels[0].substr(stageLabels[0].indexOf(":") + 1).toLowerCase().trim()

        // returning the opposite of whether or not the project card is in the right column
        return ! await isProjectCardInRightColumn(column.name, stage);
    } catch (err) {
        throw new Error(err.stack);
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
        throw new Error(err.stack);
    }
}

module.exports = {
    issueAddedToProject,
    issueRemovedFromProject,
    projectCardConverted,
    issueLabeled,
    projectCardMoved
}