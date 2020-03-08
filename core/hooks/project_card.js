
/**
 * 
 * @param {*} data 
 */
function projectCard(data) {
    return new Promise((resolve, reject) => {
        
        let repo = {
            owner: data.repository.owner.login,
            name: data.repository.name
        }

        switch (data.action) {
            case 'created':
                // issue added to project or standalone project card created
                resolve();
                break;
        }
        
    });
}

module.exports = {
    projectCard
}