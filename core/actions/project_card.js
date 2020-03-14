const request = require('../../utils/request');

/**
 * Moves the project card to the specified column
 * 
 * @param {string} id project card id to move 
 * @param {string} position Can be one of top, bottom, or after:<card_id>, where <card_id> is the id value of a card in the same column, or in the new column specified by column_id
 * @param {int} columnID the id value of a column in the same project as the project card
 */
function moveProjectCard(id, position, columnID) {
    return new Promise((resolve, reject) => {
        let data = {
            position: position,
            column_id: parseInt(columnID)
        }

        let options = {
            path: `/projects/columns/cards/${id}/moves`,
            headers: {
                Accept: 'application/vnd.github.inertia-preview+json'
            }
        }

        request.post(options, data).then((res) => {
            if (res.statusCode === 201) {
                //TODO: get projct card id and colum id moved to (parameters at least)
                return resolve(`successfully moved project card`)
            } else {
                return reject(new Error(`expected 201 recieved ${res.statusCode} ${res.method} ${res.path}\nresponse data: ${JSON.stringify(res.data)}`));
            }
        })
    });
}

module.exports = {
    moveProjectCard
}