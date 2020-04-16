const request = require('../../utils/request');

/**
 * Moves the project card to the specified column
 * 
 * @param {String} cardID project card ID to move
 * @param {String} columnID column ID to move project card to 
 */
async function moveProjectCard(cardID, columnID) {
    try {
        let options = {
            path: `/graphql`
        }

        let payload = {
            query: `mutation {
                moveProjectCard(input:{cardId: "${cardID}", columnId: "${columnID}"}) {
                    cardEdge {
                        node {
                            id
                            column {
                                name
                            }
                        }
                    }
                }
            }`
        }

        let resp = await request.post(options, payload);

        return await request.handleQL(resp);

    } catch (err) {
        throw err;;
    }
}

/**
 * Delete the project card.
 * 
 * @param {String} cardID project card ID to remove
 */
async function deleteProjectCard(cardID) {
    try {
        let options = {
            path: `/projects/columns/cards/${cardID}`,
            headers: {
                "Accept": "application/vnd.github.inertia-preview+json"
            }
        }

        let resp = await request.del(options);

        return await request.handleRest(204, resp);
    } catch (err) {
        throw err;;
    }
}

module.exports = {
    moveProjectCard,
    deleteProjectCard
}