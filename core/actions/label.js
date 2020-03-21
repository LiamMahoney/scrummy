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
        throw new Error (err.stack);
    }
}

module.exports = {
    getAllLabels
}