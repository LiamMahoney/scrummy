class OutOfState extends Error {
    constructor(...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, OutOfState);
        }

        this.name = 'OutOfState';
    }
}

class MissingProjectLabel extends OutOfState {
    constructor(...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MissingProjectLabel);
        }

        this.name = 'MissingProjectLabel';
    }
}

module.exports = {
    OutOfState,
    MissingProjectLabel
}