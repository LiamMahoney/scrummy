const request = require('../../utils/request');
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
 * @param {string} url: API url to get project detials
 */
function getProject(url) {

}

module.exports = {
    createProject
}