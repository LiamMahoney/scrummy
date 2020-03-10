const { Milestone } = require('../states');

/**
 *
 */
function milestone(data) {
    return new Promise((resolve, reject) => {
        switch (data.action) {
            case 'created':
                return resolve(Milestone.milestoneCreated(data));
                break;
        }      
    });
}

module.exports = {
    milestone
}