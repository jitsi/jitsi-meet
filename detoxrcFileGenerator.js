const fs = require('file-system');
const devices = require('./tests/mobile/constants.js');

const data = {
    'testRunner': 'jest',
    'runnerConfig': 'tests/mobile/config.json',
    'skipLegacyWorkersInjection': true,
    'devices': {
        'emulator': {
            'type': 'android.emulator',
            'device': {
                'avdName': devices.config.android
            }
        },

        'simulator': {
            'type': 'ios.simulator',
            'device': {
                'type': devices.config.ios
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
            'device': 'emulator',
            'app': 'android.release'
        },

        'ios': {
            'device': 'simulator',
            'app': 'ios.release'
        }
    }
};

const detoxrc = JSON.stringify(data, null, 2);

fs.writeFile('./.detoxrc.json', detoxrc);
