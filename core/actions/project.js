const request = require('../../utils/request');
const url = require('url');

/**
 * Creates a new project board.
 * 
 * @param {string} name: name to use for the project
 * @param {string} description: description of the project 
 * @param {Object} repo: {name: "repo name", owner: "owenr of repo git sign on"}
 */
function createProject(name, description, repo) {
    return new Promise((resolve, reject) => {
        let data = {
            name: name,
            body: description
        }

        let options = {
            path: `/repos/${repo.owner}/${repo.name}/projects`,
            headers: {
                Accept: 'application/vnd.github.inertia-preview+json'
            }
        }

        request.post(options, data).then((res) => {
            if (res.statusCode === 201) {
                resolve(`created new project '${res.data.name}'`);
            } else {
                reject(new Error(`expected: 201 recieved ${res.statusCode} ${res.method} ${res.path}\nresponse data: ${JSON.stringify(res.data)}`));
            }            
        });
    });
}

/**
 * 
 * @param {string} apiURL: API url to get project detials
 */
function getProject(apiURL) {
    return new Promise((resolve, reject) => {
        let options = {
            path: url.parse(apiURL).pathname,
            headers: {
                Accept: 'application/vnd.github.inertia-preview+json'
            }
        }

        request.get(options).then((res) => {
            if (res.statusCode === 200) {
                resolve(res);
            } else {
                reject(new Error(`expected 200 recieved ${res.statusCode} ${res.method} ${res.path}\nresponse data: ${JSON.stringify(res.data)}`));
            }
        });
    });
}

module.exports = {
    createProject,
    getProject
}