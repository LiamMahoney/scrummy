class OutOfState extends Error {
    constructor(message) {
        super(message);
        this.name = 'OutOfState';
    }
}

module.exports = {
    OutOfState
}