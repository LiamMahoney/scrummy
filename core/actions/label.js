const request = require('../../utils/request');

/**
 * Creates a new label in the format `type: title`.
 * 
 * @param {string} type: the label type
 * @param {string} title: the laebl title
 * @param {Object} repo: repository information {name: "repository name", owner: "owner github login"}
 */
function createLabel(type, title, repo) {
    return new Promise((resolve, reject) => {
        let data = {
            name: `${type}: ${title}`,
            color: genColor()
        }

        let options = {
            path: `/repos/${repo.owner}/${repo.name}/labels`
        }

        request.post(options, data).then((res) => {
            if (res.statusCode === 201) {
                return resolve(`created new label '${res.data.name}'`);
            } else {
                return reject(new Error(`expected: 201 recieved: ${res.statusCode} ${res.method} ${res.path}\nresponse data: ${JSON.stringify(res.data)}`));
            }            
        });
    });
}

/**
 * Gets all of the labels in the repository.
 * 
 * @param {Object} repo: repository information {name: "repository name", owner: "owner github login"}
 * @returns {Array}: list of all the label objects in the repository
 */
function getAllRepositoryLabels(repo) {
    return new Promise((resolve, reject) => {
        let options = {
            path: `/repos/${repo.owner}/${repo.name}/labels`
        }

        request.get(options).then((res) => {
            if (res.statusCode === 200) {
                return resolve(res);
            } else {
                return reject(new Error(`expected: 200 recieved: ${res.statusCode} ${res.method} ${res.path}\nresponse data: ${JSON.stringify(res.data)}`));
            }
        });
    });
}

/**
 * Adds the list of label names to the issue
 * 
 * @param {Array} labels: list of label names
 * @param {int} issueNumber: the issue number
 * @param {Object} repo: repository information {name: "repository name", owner: "owner github login"}
 */
function addLabelsToIssue(labels, issueNumber, repo) {
    return new Promise((resolve, reject) => {
        let options = {
            path: `/repos/${repo.owner}/${repo.name}/issues/${issueNumber}/labels`
        }

        request.post(options, labels).then((res) => {
            if (res.statusCode === 200) {
                // getting issue number from the path of the request (returned from request)
                let issueNumber = res.path.match(/\/(\d*?)\//)[1];
                // array of tag names built from response objects
                let tags = res.data.map(obj => obj.name);

                return resolve(`Added the tags: [${tags.join(", ")}] to issue ${issueNumber}`);
            } else {
                return reject(new Error(`expected: 200 recieved: ${res.statusCode} ${res.method} ${res.path}\nresponse data: ${JSON.stringify(res.data)}`));
            }
        });
    });
}

/**
 * Gnerates a random color hex string
 * @returns {string}: hex representation of the color
 */
function genColor() {
    return Math.floor(Math.random() * 16777215).toString(16);
}

module.exports = {
    createLabel,
    getAllRepositoryLabels, 
    addLabelsToIssue
}