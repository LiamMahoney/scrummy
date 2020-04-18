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
                return await Issue.projectCardCreated(data);
            case 'deleted':
                // issue removed from a project or standalone project card deleted
                return await Issue.projectCardDeleted(data);
            case 'converted':
                // project card converted into an issue
                return await Issue.projectCardConverted(data);
            case 'moved':
                // issue is moved in project
                return await Issue.projectCardMoved(data);
        }   
    } catch (err) {
        throw err;
    }
}

module.exports = {
    projectCard
}