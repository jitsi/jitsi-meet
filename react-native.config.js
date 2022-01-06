/**
 * This is needed because the RN cli incorrectly detects the iOS app path as
 * jitsi-meet/ios/app and thus all pod references in the now dynamically generated
 * Podfile are wrong.
 */
module.exports = {
    project: {
        ios: {
            project: '.ios/jitsi-meet.xcworkspace'
        }
    }
};
