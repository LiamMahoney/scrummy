const request = require('../../utils/request');
const url = require('url');


/**
 * Gets details about an issue given an api URL (which is typically
 * given in an API request from github).
 * 
 * @param {String} url: Full API url to issue
 */
function getIssue(apiURL) {
    return new Promise((resolve, reject) => {
        let path = url.parse(apiURL);

        let options = {
            path: path.pathname
        }

        request.get(options).then((response) => {
            resolve(response);
        });
    });
}

module.exports = {
    getIssue
}