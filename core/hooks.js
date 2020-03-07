const { milestone } = require('./hooks/milestone');
const { issues } = require('./hooks/issues');
const { project } = require('./hooks/project');

// This file holds all of the hooks so there is only one import required in scrummy.js

// the hooks directory is used to figure out what updates are needed based on the action that occurred

module.exports = {
    milestone,
    issues,
    project
}