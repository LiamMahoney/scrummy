const request = require('../../utils/request');
const url = require('url');

/**
 * Gets issue information from the issue URL returned 
 * from a webhook.
 * 
 * @param {string} issURL URL for github 'GET issue' request - from webhook
 */
async function getIssue(issURL) {
    try {

        let options = {
            path: url.parse(issURL).path
        }

        let resp = await request.get(options);

        return await request.handleRest(200, resp);

    } catch (err) {

        throw err;

    } 
}

/**
 * Adds labels to a GitHub issue.
 * 
 * @param {int} issue Github issue number
 * @param {Array} labels label name strings to add e.g. ['duplicate', 'bug']
 * @param {String} repoOwner Github login of the owner of the repo
 * @param {String} repoName name of the repository
 * @returns {String} contains which labels were added to which issue
 */
async function addLabels(issue, labels, repoOwner, repoName) {
    try {

        let options = {
            path: `/repos/${repoOwner}/${repoName}/issues/${issue}/labels`
        }

        let payload = {
            labels: labels
        }

        let resp = await request.post(options, payload);

        await request.handleRest(200, resp);

        return `added label(s) [${labels.join(', ')}] to issue #${issue}`;

    } catch (err) {

        throw err;

    }
}

/**
 * Removes a label from a GitHub issue.
 * 
 * @param {int} issue Github issue number
 * @param {String} label label name
 * @param {String} repoOwner Github login of the owner of the repo
 * @param {String} repoName name of the repository
 * @returns {String} contains which label was removed from which issue
 */
async function removeLabel(issue, label, repoOwner, repoName) {
    try {

        let options = {
            path: `/repos/${repoOwner}/${repoName}/issues/${issue}/labels/${label}`
        }

        let resp = await request.del(options);

        await request.handleRest(200, resp);

        return `removed label '${label}' from issue #${issue}`;

    } catch (err) {

        throw err;

    }
}

/**
 * Gets all of the project cards associated to the issue. Also gets
 * all of the project columns in each project card's corresponding 
 * project.
 * 
 * @param {int} issueNumber github issue number 
 * @param {String} repoOwner Github login of the owner of the repository
 * @param {String} repoName name of the repository
 */
async function getIssueProjectCards(issueNumber, repoOwner, repoName) {
    try {

        let options = {
            path: `/graphql`
        }

        let payload = {
            query: `query {
                repository(owner:"${repoOwner}", name:"${repoName}") {
                    issue(number:${issueNumber}) {
                        title
                        projectCards {
                            edges{
                                node {
                                    id
                                    databaseId
                                    column {
                                        id
                                        name
                                    }
                                    project {
                                        id
                                        name
                                        state
                                        columns(first: 20){
                                            edges {
                                                node{
                                                    id
                                                    name
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`
        }

        let resp = await request.post(options, payload);

        return await request.handleQL(resp);

    } catch(err) {
        throw err;
    }
}

/**
 * Adds an issue to a project. 
 * 
 * @param {int} issueNumber the number of the issue
 * @param {String} projectName the name of the project to add the issue to
 * @param {String} columnID the ID of the column to add the issue to
 * @param {String} contentID issue ID to associated with the card
 * @param {String} contentType describes the contentID, either ['Issue', 'PullRequest']
 */
async function addIssueToProject(issueNumber, projectName, columnID, contentID, contentType) {
    try {
        let options = {
            path: `/projects/columns/${columnID}/cards`,
            headers: {
                "Accept": "application/vnd.github.inertia-preview+json"
            }
        }

        let payload = {
            content_id: contentID,
            content_type: contentType
        }

        let resp = await request.post(options, payload);

        await request.handleRest(201, resp);

        return `Added issue #${issueNumber} to the project '${projectName}'`;
    } catch (err) {
        throw err;
    }
}

/**
 * Removes the milestone from an issue or pull request.
 * 
 * @param {int} issueNumber issue / pr number 
 * @param {String} repoOwner github login of the repository owner
 * @param {String} repoName name of the github repository
 */
async function removeMilestoneFromIssue(issueNumber, repoOwner, repoName) {
    try {
        let options = {
            path: `/repos/${repoOwner}/${repoName}/issues/${issueNumber}`
        }

        let payload = {
            milestone: null
        }

        await request.handleRest(200, await request.patch(options, payload));

        return `removed milestone from #${issueNumber}`;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    getIssue,
    addLabels,
    removeLabel,
    getIssueProjectCards,
    addIssueToProject,
    removeMilestoneFromIssue
}