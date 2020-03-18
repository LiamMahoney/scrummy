const { Milestone } = require('../states');

/**
 *
 */
function milestone(data) {
    return new Promise((resolve, reject) => {
        switch (data.action) {
            case 'created':
                Milestone.milestoneCreated(data).then((response) => {
                    return resolve(response);
                }).catch((err) => {
                    return reject(err);
                });
                break; //FIXME: is this redundant?
        }      
    });
}

module.exports = {
    milestone
}