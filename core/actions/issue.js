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

        return await request.handleRest(200, resp);

    } catch (err) {

        throw new Error(err.stack);

    }
}

/**
 * Removes labels from a GitHub issue.
 * 
 * @param {int} issue Github issue number
 * @param {Array} labels label name strings to add e.g. ['duplicate', 'bug']
 * @param {String} repoOwner Github login of the owner of the repo
 * @param {String} repoName name of the repository
 */
async function removeLabels(issue, labels, repoOwner, repoName) {
    try {

        let options = {
            path: `/repos/${repoOwner}/${repoName}/issues/${issue}/labels`
        }

        let payload = {
            labels: labels
        }

        let resp = await request.del(options, payload);

        return await request.handleRest(200, resp);

    } catch (err) {

        throw new Error(err.stack);
        
    }
}

module.exports = {
    getIssue,
    addLabels
}