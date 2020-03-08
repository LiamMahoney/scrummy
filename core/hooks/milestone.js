const { Project } = require('../actions');

/**
 *
 */
function milestone(data) {
    return new Promise((resolve, reject) => {
        
        let repo = {
            owner: data.repository.owner.login,
            name: data.repository.name
        }

        switch (data.action) {
            case 'created':
                resolve(Project.createProject(data.milestone.title, `${data.milestone.description}\nDue on: ${data.milestone.due_on}`, repo));
                break;
        }
        
    });
}

module.exports = {
    milestone
}