const { Milestone } = require('../states');

/**
 *
 */
function milestone(data) {
    return new Promise((resolve, reject) => {
        switch (data.action) {
            case 'created':
                resolve(Milestone.milestoneCreated(data));
                break;
        }      
    });
}

module.exports = {
    milestone
}