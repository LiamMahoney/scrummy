const { Label } = require('../actions');

function project(data) {
    console.debug(`project recieved action: ${data.action}`);
    switch (data.action) {
        case 'created':
            Label.createLabel("project", data.project.body);
            break;
    }
}

module.exports = {
    project
}