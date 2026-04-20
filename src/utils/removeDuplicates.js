/**
 * Removes duplicate values from an array.
 * @param {Array} arr - The array to deduplicate.
 * @returns {Array} - A new array with duplicates removed.
 */
function removeDuplicates(arr) {
    return [...new Set(arr)];
}

module.exports = removeDuplicates;