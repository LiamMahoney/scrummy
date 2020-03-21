const winston = require('winston');
const path = require('path');
const config = require('../config/config.json');

const log = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `${info.timestamp} [${info.level}] ${info.message}`)
    ),
    transports: [
        new winston.transports.File({
            level: "info",
            filename: config.logFile,
            maxsize: config.maxLogSize,
            maxFiles: config.maxLogFiles,
            tailable: true,
            zippedArchive: true,
            json: true,
            timestamp: true
        })
    ]
});

module.exports = { log }