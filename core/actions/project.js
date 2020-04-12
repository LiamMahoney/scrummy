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

/**
 * Gets project column information from the column URL returned 
 * from the webhook.
 * 
 * @param {string} columnURL URL for github GET project column request - from webhook
 */
async function getColumn(columnURL) {
    try {
        let options = {
            path: url.parse(columnURL).path,
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

/**
 * Gets all of the projects within the repository.
 * 
 * @param {String} repoOwner Owner of the repository to look in for projects
 * @param {String} repoName name of the reposiotyr to look in for projects
 */
async function getRepoProjects(repoOwner, repoName) {
    try {
        let options = {
            path: `/repos/${repoOwner}/${repoName}/projects`,
            headers : {
                Accept: 'application/vnd.github.inertia-preview+json'
            }
        }

        let resp = await request.get(options);

        return await request.handleRest(200, resp);

    } catch (err) {
        throw new Error(err.stack);
    }
}

/**
 * Gets all of the columns in the project.
 * 
 * @param {String} URL GET project API URL 
 */
async function getProjectColumns(URL) {
    try {
        let options = {
            path: url.parse(URL).path,
            headers: {
                "Accept": "application/vnd.github.inertia-preview+json"
            }
        }

        let resp = await request.get(options);

        return await request.handleRest(200, resp);
    } catch(err) {
        throw new Error(err.stack);
    }
}

module.exports = {
    getProject,
    getColumn,
    getRepoProjects,
    getProjectColumns
}