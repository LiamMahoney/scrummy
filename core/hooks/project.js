const { Label } = require('../actions');

function project(data) {
    console.debug(`project recieved action: ${data.action}`);
    let repo = {
        owner: data.repository.owner.login,
        name: data.repository.name
    }

    switch (data.action) {
        case 'created':
            Label.createLabel("project", data.project.body, repo);
            break;
    }
}

module.exports = {
    project
}