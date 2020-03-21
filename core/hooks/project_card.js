const { Issue } = require('../states');

/**
 * 
 * @param {*} data 
 */
async function projectCard(data) {
    try{
        switch (data.action) {
            case 'created':
                // issue added to project or standalone project card created
                return await Issue.issueAddedToProject(data);
            case 'moved':
                // issue is moved in project
        }   
    } catch (err) {
        throw new Error(err.stack);
    }
}

module.exports = {
    projectCard
}