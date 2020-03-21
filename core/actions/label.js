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

        if (resp.statusCode === 200) {
            return resp.data;
        } else {
            //TODO: update with more information
            throw new Error(`expected 200 recieved: ${resp.statusCode} - ${resp.method} ${resp.path}: ${resp.data}`);
        }

    } catch (err) {
        throw new Error (err.stack);
    }
}

module.exports = {
    getAllLabels
}