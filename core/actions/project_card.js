const request = require('../../utils/request');

/**
 * Moves the project card to the specified column
 * 
 * @param {String} cardID project card ID
 * @param {String} columnID column ID to move project card to 
 */
async function moveProjectCard(cardID, columnID) {
    try {
        let options = {
            path: `/graphql`
        }

        let payload = {
            mutation: `mutation {
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
              }
            `
        }

        let resp = request.post(options, payload);

        return await request.handleQL(resp);

    } catch (err) {
        throw new Error(err.stack);
    }
}

module.exports = {
    moveProjectCard
}