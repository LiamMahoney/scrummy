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

/**
 * Gets all of the milestones in the repository.
 * 
 * @returns {Array} https://developer.github.com/v3/issues/milestones/#list-milestones
 */
async function getRepoMilestones(repoOwner, repoName) {
    try {
        let options = {
            path: `/repos/${repoOwner}/${repoName}/milestones`
        }

        return await request.handleRest(200, await request.get(options));

    } catch (err) {
        throw err;
    }
}

/**
 * Closes a milestone.
 * 
 * @param {int} number milestone number 
 * @param {String} repoOwner login of the owner of the repo the milestone is in
 * @param {String} repoName name of the repo the milestone is in
 */
async function close(number, repoOwner, repoName) {
    try {
        let payload = {
            state: "closed"
        }

        return await update(number, payload, repoOwner, repoName);
    } catch (err) {
        throw err;
    }
}

/**
 * Updates a github milestone.
 * 
 * @param {int} number milestone number
 * @param {Object} payload = {
 *  title: "string",
 *  state: "one of 'open' or 'closed'",
 *  description: "string",
 *  due_on: "YYYY-MM-DDTHH:MM:SSZ"
 * } 
 * @param {String} repoOwner login of the repository owner
 * @param {String} repoName name of the repository the milestone is in
 */
async function update(number, payload, repoOwner, repoName) {
    try {
        let options = {
            path: `/repos/${repoOwner}/${repoName}/milestones/${number}`
        }

        return await request.handleRest(200, await request.patch(options, payload))
    } catch (err) {
        throw err;
    }
}

module.exports = {
    getMilestoneItems,
    getRepoMilestones,
    close
}