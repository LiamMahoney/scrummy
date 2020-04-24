const request = require('../../utils/request');

/**
 * Gets all of the issues and pull requests in the milestone.
 * 
 * @param {int} milestoneNumber the milestone's number
 * @param {int} itemCount the number of 'open_issues' in the milestone
 * @param {String} repoOwner the Github login of the repository owner
 * @param {String} repoName the name of the Github repository
 */
async function getMilestoneItems(milestoneNumber, itemCount, repoOwner, repoName) {
    try {
        let options = {
            path: `/graphql`
        }

        let payload = {
            query: `query {
                repository(name: "${repoName}", owner: "${repoOwner}") {
                    milestone(number: ${milestoneNumber}) {
                        issues(first: ${itemCount}) {
                            nodes {
                                title,
                                databaseId,
                                number
                            }
                        }
                        pullRequests(first: ${itemCount}) {
                            nodes {
                                title,
                                databaseId,
                                number
                            }
                        }
                    }
                }
            }`
        }

        return await request.handleQL(await request.post(options, payload));

    } catch (err) {
        throw err;
    }
}

module.exports = {
    getMilestoneItems
}