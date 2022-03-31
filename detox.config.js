/* eslint-disable no-undef */

const { IOS_SIMULATOR } = require('./tests/mobile/constants');
const { getAndroidConfiguration, getAndroidDevices } = require('./tests/mobile/functions');


module.exports = {
    'testRunner': 'jest',
    'runnerConfig': 'tests/mobile/config.json',
    'skipLegacyWorkersInjection': true,
    'devices': {
        ...getAndroidDevices(),

        'simulator': {
            'type': 'ios.simulator',
            'device': {
                'type': IOS_SIMULATOR
            }
        }
    },
    'apps': {
        'android.release': {
            'type': 'android.apk',
            'binaryPath': 'android/app/build/outputs/apk/release/app-release.apk',
            'build': 'cd android && ./gradlew assembleRelease assembleAndroidTest && cd ..'
        },

        'ios.release': {
            'type': 'ios.app',
            'binaryPath': 'ios/DerivedData/Build/Products/Release-iphonesimulator/jitsi-meet.app',
            // eslint-disable-next-line max-len
            'build': 'xcodebuild -workspace ios/jitsi-meet.xcworkspace -scheme JitsiMeet -configuration Release -derivedDataPath ios/DerivedData'
        }
    },
    'configurations': {
        'android': {
            ...getAndroidConfiguration(),
            'app': 'android.release'
        },

        'ios': {
            'device': 'simulator',
            'app': 'ios.release'
        }
    }
};
