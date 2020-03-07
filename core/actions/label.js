/**
 * Creates a new label in the format `type: title`.
 * 
 * @param {string} type: the label type
 * @param {string} title: the laebl title
 */
function createLabel(type, title) {
    console.log(`creating label '${type}: ${title}`);
}

module.exports = {
    createLabel
}