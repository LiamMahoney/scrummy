const request = require('../../utils/request');
const { log } = require('../../utils/log');

/**
 * Creates a new label in the format `type: title`.
 * 
 * @param {string} type: the label type
 * @param {string} title: the laebl title
 * @param {Object} repo: repository information {name: "repository name", owner: "owner github login"}
 */
function createLabel(type, title, repo) {

    let data = {
        name: `${type}: ${title}`,
        color: genColor()
    }

    let options = {
        path: `/repos/${repo.owner}/${repo.name}/labels`
    }

    request.post(options, data).then((res) => {
        if (res.statusCode !== 201) {
            throw `expected 201 but recieved ${res.statusCode} ${res.method} ${res.path} ${res.data}`;
        } else {
            log.info(`created label ${res.data.name}`);
        }
    }).catch((err) => {
        throw err.stack;
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
    createLabel
}