const request = require('../../utils/request');

/**
 * Gets all of the labels in the repository.
 * 
 * @param {string} repoOwner owner of the repo to get labels from
 * @param {string} repoName name of the repo to get labels from
 * @returns {Array} list of objects that represent a label
 */
async function getAllLabels(repoOwner, repoName) {
    try {

        let opts = {
            path: `/repos/${repoOwner}/${repoName}/labels`
        }

        let resp = await request.get(opts);

        return await request.handleRest(200, resp);

    } catch (err) {
        throw err;
    }
}

/**
 * Creates a new label with a random color.
 * 
 * @param {string} repoOwner owner of the repo to add a label to
 * @param {string} repoName name of the repo to add a label to
 * @param {string} labelName the name of the label to create
 */
async function createLabel(repoOwner, repoName, labelName) {
    try {
        let color = randomColor();

        let opts = {
            path: `/repos/${repoOwner}/${repoName}/labels`
        }

        let payload = {
            name: labelName,
            color: color
        }

        let resp = await request.handleRest(201, await request.post(opts, payload));

        return `created label '${resp.name}'`;

    } catch (err) {
        throw err;
    }
}

/**
 * Deletes a label from a repository.
 * 
 * @param {String} labelName the label to delete
 * @param {String} repoOwner the login of the owner of the repo
 * @param {String} repoName the name of the repo the label is in
 * @returns {String} states what label was deleted
 */
async function deleteLabel(labelName, repoOwner, repoName) {
    try {
        let opts = {
            path: `/repos/${repoOwner}/${repoName}/labels/${labelName}`
        }

        let resp = await request.handleRest(204, await request.del(opts));

        return `deleted label '${labelName}' from repository '${repoName}'`;
    } catch (err) {
        throw err;
    }
}

/**
 * Generates a random color.
 * 
 * @returns {string} hex descibing a color
 */
function randomColor() {
    return Math.floor(Math.random() * Math.floor(16777215)).toString(16);
}

module.exports = {
    getAllLabels,
    createLabel,
    deleteLabel
}