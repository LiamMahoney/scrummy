module.exports = {
    /**
     * Creates a new label in the format `type: title`.
     * 
     * @param {string} type: the label type
     * @param {string} title: the laebl title
     */
    createLabel: function (type, title) {
        console.log(`creating label '${type}: ${title}`);
    }
}
