/**
 * This is needed because the RN cli incorrectly detects the iOS app path as
 * jitsi-meet/ios/app and thus all pod references in the now dynamically generated
 * Podfile are wrong.
 */
module.exports = {
    // Exclude some dependencies from auto-linking for the lite SDK.
    dependencies: {
        '@giphy/react-native-sdk': {
            platforms: {
                ios: null
            }
        },
        '@react-native-google-signin/google-signin': {
            platforms: {
                ios: null
            }
        },
        'react-native-calendar-events': {
            platforms: {
                ios: null
            }
        },
        'react-native-watch-connectivity': {
            platforms: {
                ios: null
            }
        }
    }
};
