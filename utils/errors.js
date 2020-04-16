class OutOfState extends Error {
    constructor(message, ...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, OutOfState);
        }

        this.name = 'OutOfState';
    }
}

module.exports = {
    OutOfState
}