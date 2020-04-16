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
        throw err;;
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

        let resp = await request.post(opts, payload);

        return await request.handleRest(201, resp);

    } catch (err) {
        throw err;;
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
    createLabel
}