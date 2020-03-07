const config = require('./config/config.json');
const { log } = require('./utils/log');
const express = require('express');
const { scrummy } = require('./core/scrummy');
const { verifyPostData } = require('./utils/verify');

const app = express();

app.use(express.json());

app.post("/", verifyPostData, (req, res) => {
    scrummy(req.headers['x-github-event'], req.body);
    res.status(200).send();
});

app.use((err, req, res, next) => {
    if (err) {
        log.error(err);
    }
    res.status(403).send("Error verifying request");
});

app.listen(config.port);
