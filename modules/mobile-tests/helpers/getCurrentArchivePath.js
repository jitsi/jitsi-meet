/**
 * Return selector based on device type.
 *
 * @param {Object} driver - Driver aka browser object where the tests run
 * @param {Object} selector - Selector object.
 * @returns {string} The selector
 */

module.exports = {
    getCurrentArchivePath() {
       const archivePath = '~/Library/Developer/Xcode/Archives';
       const archiveDate = new Date().toLocaleDateString();

       return archivePath.concat(archiveDate);
    }
};
