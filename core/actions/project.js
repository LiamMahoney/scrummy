const request = require('../../utils/request');
const url = require('url');

/**
 * Gets project information from the project URL returned 
 * from the webhook.
 * 
 * @param {string} projURL URL for github GET project request - from webhook
 */
async function getProject(projURL) {
    try {
        let options = {
            path: url.parse(projURL).path,
            headers: {
                Accept: 'application/vnd.github.inertia-preview+json'
            }
        }

        let resp = await request.get(options);

        return await request.handleRest(200, resp);

    } catch (err) {
        throw new Error(err.stack);
    } 
}

module.exports = {
    getProject
}