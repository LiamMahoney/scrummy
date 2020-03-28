const { log } = require('../utils/log');
const { project, milestone, projectCard, issues } = require('./hooks');

/**
 * The main controller of the program. This function decides
 * what type of hook was sent and passes the data to the 
 * appropriate part of the program to appropriately respond
 * to what was done.
 * 
 * @param {string} type: webhook type that was recieved
 * @param {object} data: post data from webhook
 */
async function determineHook(type, data) {
    try {
        console.debug(`scrummy recieved hook with type: ${type} and action ${data.action}`);
        switch (type) {
            case 'project':
                return await project(data);
            case 'milestone':
                return await milestone(data);
            case 'project_card':
                return await projectCard(data);
            case 'issues':
                return await issues(data);
        }
    } catch (err) {
        throw err;
    }
}

/**
 * The starting point of the application. Calls the main 
 * controller and logs the response of the program.
 * 
 * @param {string} type webhook type that was recieved
 * @param {object} data post data from webhook
 */
async function scrummy(type, data) {
    try {
        let resp = await determineHook(type, data);

        if (typeof resp === 'string') {
            log.info(resp);
        } else if (typeof resp === 'object') {
            for (msg of resp) {
                log.info(msg);
            }
        } else if (typeof resp === 'undefined') {
            // do nothing
        } else {
            log.warn(`received a message of type ${typeof resp}: ${resp}`);
        }
    } catch (err) {
        log.error(err.stack);
    }
}

module.exports = {
    scrummy
}