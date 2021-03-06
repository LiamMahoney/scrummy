const { Milestone } = require('../states');

/**
 *
 * @param {Object} data mlestone webhook payload
 */
async function milestone(data) {
    try {
        switch (data.action) {
            case 'created':
                return await Milestone.milestoneCreated(data);
            case 'closed':
                return await Milestone.milestoneClosed(data);
        }      
    } catch (err) {
        throw err;
    }
}

module.exports = {
    milestone
}