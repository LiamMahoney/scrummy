const Label = require('./actions/label');
const Project = require('./actions/project');
const Issue = require('./actions/issue');
const ProjectCard = require('./actions/project_card');
const Milestone = require('./actions/milestone');
const PullRequest = require('./actions/pull_request');


// This file holds all of the actions so there is only one import required in scrummy.js

// the actions directory is used to interact with the GitHub API to either get information or to perform an action

module.exports = {
    Label,
    Project,
    Issue,
    ProjectCard,
    Milestone,
    PullRequest
}