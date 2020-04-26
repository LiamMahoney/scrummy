const request = require('../../utils/request');

/**
 * Gets pull request project cards for a PR in a repository.
 * 
 * @param {int} prNumber pull request number
 * @param {String} repoOwner owner of the repository
 * @param {String} repoName name of the repository
 */
async function getPRProjectCards(prNumber, repoOwner, repoName) {
    try {
        let options = {
            path: `/graphql`
        }

        let payload = {
            query: `query { 
                repository(name: "scrummy", owner: "LiamMahoney"){
                    pullRequest(number: 33) {
                        title
                        projectCards {
                            edges{
                                node {
                                    id
                                    databaseId
                                    column {
                                        id
                                        name
                                    }
                                    project {
                                        id
                                        name
                                        state
                                        columns(first:20) {
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

        let resp = await request.post(options, payload);

        return await request.handleQL(resp);
    } catch (err) {
        throw err;
    }
}

module.exports = {
    getPRProjectCards
}