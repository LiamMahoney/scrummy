const Issue = require('./states/issue');
const Milestone = require('./states/milestone');
const Project = require('./states/project');
const PullRequest = require('./states/pull_request');

// This file holds all of the states so there is only one import required in scrummy.js

// the states directory is used to create a response to the actions that happened in the webhook this application recieved.

module.exports = {
    Issue,
    Milestone,
    Project,
    PullRequest
}