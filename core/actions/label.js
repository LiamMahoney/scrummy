const request = require('../../utils/request');

/**
 * Gets all of the labels in the repository.
 * 
 * @param {string} repoOwner owner of the repo to get labels from
 * @param {string} repoName name of the repo to get labels from
 */
async function getAllLabels(repoOwner, repoName) {
    try {
        let query = {
            query: `query { 
                repository(name: "${repoName}", owner: "${repoOwner}"){
                    labels(first: 100) {
                        nodes {
                            name
                            id
                        }
                    }
                }
            }`
        };

        return await request.post({}, query);

    } catch (err) {
        throw new Error (err.stack);
    }
}

module.exports = {
    getAllLabels
}