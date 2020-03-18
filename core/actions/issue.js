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
            return resolve(response);
        }).catch((err) => {
            return reject(err);
        });
    });
}

/**
 * Gets the events of the issue.
 * 
 * @param {int} issue_number: the issue number
 * @param {*} repo: repository information {name: "repository name", owner: "owner github login"}
 */
function getIssueEvents(issue_number, repo) {
    return new Promise((resolve, reject) => {
        let options = {
            path: `/repos/${repo.owner}/${repo.name}/issues/${issue_number}/events`,
            headers: {
                Accept: 'application/vnd.github.starfox-preview+json'
            }
        }

        request.get(options).then((response) => {
            return resolve(response);
        }).catch((err) => {
            return reject(err);
        });
    });
}

/**
 * 
 * @param {int} issue: issue number
 * @param {Object} repo: repository information {name: "repository name", owner: "owner github login"}
 */
function getIssueProjectCards(issue, repo) {
    return new Promise((resolve, reject) => {
        let data = {
            query: `query {
                repository(owner:"${repo.owner}", name:"${repo.name}") {
                    issue(number:${issue}) {
                        title
                        projectCards {
                            edges{
                                node {
                                    id
                                    column {
                                        id
                                        name
                                    }
                                    project {
                                        id
                                        name
                                        columns(first: 20){
                                            edges {
                                                node{
                                                    id
                                                    name
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`
        }

        request.graphQLPost({}, data).then((response) => {
            return resolve(response);
        }).catch((err) => {
            return reject(err);
        });
    });
}

module.exports = {
    getIssue,
    getIssueEvents,
    getIssueProjectCards
}