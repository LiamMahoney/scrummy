
/**
 * Figures out which action is needed based on the github issue webook
 * recieved. This function only deals with issue webhooks. Actions 
 * are decided based on the data.action (what happened in github).
 * 
 * @param {Object} data: github webhook json data
 */
function issues(data) {
    return new Promise((resolve, reject) => {
        
        let repo = {
            owner: data.repository.owner.login,
            name: data.repository.name
        }

        switch (data.action) {

        }
    });
}

module.exports = {
    issues
}