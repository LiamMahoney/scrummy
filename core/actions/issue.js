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

        throw new Error(err.stack);

    } 
}

/**
 * Adds labels to a GitHub issue.
 * 
 * @param {int} issue Github issue number
 * @param {Array} labels label name strings to add e.g. ['duplicate', 'bug']
 * @param {String} repoOwner Github login of the owner of the repo
 * @param {String} repoName name of the repository
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

        return `added ${labels.join(', ')} to issue #${issue}`;

    } catch (err) {

        throw new Error(err.stack);

    }
}

/**
 * Removes a label from a GitHub issue.
 * 
 * @param {int} issue Github issue number
 * @param {String} label label name
 * @param {String} repoOwner Github login of the owner of the repo
 * @param {String} repoName name of the repository
 */
async function removeLabel(issue, label, repoOwner, repoName) {
    try {

        let options = {
            path: `/repos/${repoOwner}/${repoName}/issues/${issue}/labels/${label}`
        }

        let resp = await request.del(options);

        await request.handleRest(200, resp);

        return `removed ${label} from issue #${issue}`;

    } catch (err) {

        throw new Error(err.stack);

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
        throw new Error(err.stack);
    }
}

module.exports = {
    getIssue,
    addLabels,
    removeLabel,
    getIssueProjectCards
}