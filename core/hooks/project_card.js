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
                return 'not implemeneted';
            case 'deleted':
                // issue removed from a project or standalone project card deleted
                return 'not implemented';
            case 'converted':
                // project card converted into an issue
                return 'not implemented';
            case 'moved':
                // issue is moved in project
                return 'not implemented';
        }   
    } catch (err) {
        throw err;
    }
}

module.exports = {
    projectCard
}